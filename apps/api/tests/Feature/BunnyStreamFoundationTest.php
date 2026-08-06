<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\MediaAsset;
use App\Models\MediaUploadSession;
use App\Models\Permission;
use App\Models\PlatformBunnySetting;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantIntegration;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Bunny\Contracts\BunnyStreamInterface;
use App\Services\Media\BunnyStreamService;
use App\Services\Media\MediaManager;
use App\Services\Media\Providers\BunnyStreamProvider;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BunnyStreamFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_bunny_stream_provider_is_registered_separately_from_storage(): void
    {
        $manager = app(MediaManager::class);

        $this->assertTrue($manager->hasProvider('bunny'));
        $this->assertTrue($manager->hasServiceProvider('bunny', 'stream'));
        $this->assertInstanceOf(BunnyStreamProvider::class, $manager->providerFor('bunny', 'stream'));
    }

    public function test_video_upload_intent_creates_stream_asset_and_upload_session(): void
    {
        $tenant = Tenant::factory()->create();
        $owner = $this->memberWithRole($tenant, 'tenant_owner');
        $this->createBunnyStreamIntegration($tenant);

        Sanctum::actingAs($owner->user);

        $response = $this->postJson('/api/v1/media/videos/upload-intents', [
            'original_filename' => 'lesson-intro.mp4',
            'mime_type' => 'video/mp4',
            'size_bytes' => 4096,
        ], $this->tenantHeader($tenant));

        $response
            ->assertCreated()
            ->assertJsonPath('asset.provider', 'bunny')
            ->assertJsonPath('asset.provider_service', 'stream')
            ->assertJsonPath('asset.type', 'video')
            ->assertJsonPath('asset.status', 'pending')
            ->assertJsonPath('upload_session.provider_service', 'stream')
            ->assertJsonPath('upload_session.status', 'draft')
            ->assertJsonPath('intent.provider_service', 'stream');

        $this->assertDatabaseHas('media_assets', [
            'id' => $response->json('asset.id'),
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'provider_service' => 'stream',
            'type' => 'video',
        ]);
    }

    public function test_video_upload_confirmation_synchronizes_metadata(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $this->createBunnyStreamIntegration($tenant);

        Sanctum::actingAs($admin->user);

        $sessionId = $this->postJson('/api/v1/media/videos/upload-intents', [
            'original_filename' => 'chapter.mp4',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('upload_session.id');

        $this->postJson("/api/v1/media/videos/upload-intents/{$sessionId}/confirm", [
            'encoding_status' => 'Uploaded',
            'duration_seconds' => 120,
            'available_resolutions' => ['720p', '1080p'],
            'thumbnail_url' => 'https://cdn.example.test/thumb.jpg',
            'preview_url' => 'https://cdn.example.test/preview.gif',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('asset.status', 'uploading')
            ->assertJsonPath('asset.metadata.duration_seconds', 120)
            ->assertJsonPath('asset.metadata.available_resolutions.0', '720p')
            ->assertJsonPath('upload_session.status', 'completed');
    }

    public function test_video_status_uses_bunny_stream_provider(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $this->createBunnyStreamIntegration($tenant);

        Sanctum::actingAs($admin->user);

        $assetId = $this->postJson('/api/v1/media/videos/upload-intents', [
            'original_filename' => 'status.mp4',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('asset.id');

        $this->getJson("/api/v1/media/videos/{$assetId}/status", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('provider.provider_service', 'stream')
            ->assertJsonPath('provider.status', 'pending');
    }

    public function test_bunny_status_mapping(): void
    {
        $service = app(BunnyStreamService::class);

        $this->assertSame('pending', $service->mapStatus('Created'));
        $this->assertSame('uploading', $service->mapStatus('Uploaded'));
        $this->assertSame('processing', $service->mapStatus('Processing'));
        $this->assertSame('ready', $service->mapStatus('Ready'));
        $this->assertSame('failed', $service->mapStatus('Failed'));
    }

    public function test_webhook_processing_is_idempotent_and_synchronizes_metadata(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $this->createBunnyStreamIntegration($tenant, 'tenant-secret');

        Sanctum::actingAs($admin->user);

        $assetId = $this->postJson('/api/v1/media/videos/upload-intents', [
            'original_filename' => 'webhook.mp4',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('asset.id');

        $asset = MediaAsset::withoutGlobalScopes()->findOrFail($assetId);
        $payload = [
            'video_id' => $asset->external_id,
            'encoding_status' => 'Ready',
            'duration_seconds' => 300,
            'available_resolutions' => ['360p', '720p'],
            'thumbnail_url' => 'https://cdn.example.test/thumb.jpg',
            'preview_url' => 'https://cdn.example.test/preview.gif',
        ];
        $headers = $this->webhookHeaders($payload, 'tenant-secret');

        $this->postJson('/api/v1/integrations/bunny/webhooks', $payload, $headers)
            ->assertOk()
            ->assertJsonPath('asset.status', 'ready')
            ->assertJsonPath('asset.metadata.duration_seconds', 300);

        $this->postJson('/api/v1/integrations/bunny/webhooks', $payload, $headers)
            ->assertOk()
            ->assertJsonPath('asset.status', 'ready');

        $this->assertSame(1, MediaAsset::withoutGlobalScopes()->whereKey($assetId)->count());
    }

    public function test_webhook_rejects_unknown_assets_and_invalid_signatures(): void
    {
        $tenant = Tenant::factory()->create();
        $this->createBunnyStreamIntegration($tenant, 'tenant-secret');

        $payload = ['video_id' => 'missing-video', 'encoding_status' => 'Ready'];

        $this->postJson('/api/v1/integrations/bunny/webhooks', $payload, $this->webhookHeaders($payload, 'tenant-secret'))
            ->assertNotFound();

        $this->bindTenant($tenant);

        $asset = MediaAsset::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'provider_service' => 'stream',
            'type' => 'video',
            'status' => 'pending',
            'visibility' => 'private',
            'external_id' => 'known-video',
            'metadata' => [],
        ]);

        $this->postJson('/api/v1/integrations/bunny/webhooks', [
            'video_id' => $asset->external_id,
            'encoding_status' => 'Ready',
        ], ['X-Bunny-Signature' => 'bad'])
            ->assertUnauthorized();
    }

    public function test_video_uploads_are_tenant_isolated(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $firstAdmin = $this->memberWithRole($firstTenant, 'admin');
        $secondAdmin = $this->memberWithRole($secondTenant, 'admin');
        $this->createBunnyStreamIntegration($firstTenant);
        $this->createBunnyStreamIntegration($secondTenant);

        Sanctum::actingAs($firstAdmin->user);

        $intent = $this->postJson('/api/v1/media/videos/upload-intents', [
            'original_filename' => 'tenant-one.mp4',
        ], $this->tenantHeader($firstTenant))->assertCreated();

        Sanctum::actingAs($secondAdmin->user);

        $this->getJson('/api/v1/media/videos/'.$intent->json('asset.id').'/status', $this->tenantHeader($secondTenant))
            ->assertNotFound();

        $this->postJson('/api/v1/media/videos/upload-intents/'.$intent->json('upload_session.id').'/confirm', [], $this->tenantHeader($secondTenant))
            ->assertNotFound();
    }

    public function test_assigned_instructor_can_create_video_upload_sessions(): void
    {
        $tenant = Tenant::factory()->create();
        $instructor = $this->memberWithRole($tenant, 'instructor');
        $this->createBunnyStreamIntegration($tenant);
        $course = $this->createCourse($tenant, ['primary_instructor_tenant_user_id' => $instructor->id]);

        Sanctum::actingAs($instructor->user);

        $this->postJson('/api/v1/media/videos/upload-intents', [
            'course_id' => $course->id,
            'original_filename' => 'assigned.mp4',
        ], $this->tenantHeader($tenant))
            ->assertCreated();
    }

    public function test_students_cannot_create_video_upload_sessions(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->createBunnyStreamIntegration($tenant);

        Sanctum::actingAs($student->user);

        $this->postJson('/api/v1/media/videos/upload-intents', [
            'original_filename' => 'denied.mp4',
        ], $this->tenantHeader($tenant))
            ->assertForbidden();
    }

    public function test_stream_provider_falls_back_to_platform_settings_when_tenant_config_lacks_stream_library(): void
    {
        $tenant = Tenant::factory()->create();
        $this->bindTenant($tenant);
        $this->createPlatformStreamSettings();
        $this->createStreamIntegrationWithoutCredentials($tenant);

        $asset = MediaAsset::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'provider_service' => 'stream',
            'type' => 'video',
            'status' => 'pending',
            'visibility' => 'private',
            'external_id' => 'video-fallback-1',
            'mime_type' => 'video/mp4',
            'metadata' => [],
        ]);

        $session = MediaUploadSession::create([
            'tenant_id' => $tenant->id,
            'media_asset_id' => $asset->id,
            'provider' => 'bunny',
            'provider_service' => 'stream',
            'status' => 'draft',
            'expires_at' => now()->addMinutes(30),
            'metadata' => [],
        ]);

        $intent = app(MediaManager::class)
            ->providerFor('bunny', 'stream')
            ->createUploadIntent($session);

        $this->assertSame('stream', $intent['provider_service']);
        $this->assertStringContainsString('/library/platform-lib-1/videos/', $intent['upload_url']);
        $this->assertSame('platform-stream-key', $intent['headers']['AccessKey']);
    }

    public function test_stream_provider_playback_data_falls_back_to_pull_zone_when_api_unavailable(): void
    {
        $tenant = Tenant::factory()->create();
        $this->bindTenant($tenant);
        $this->createPlatformStreamSettings();
        $this->createStreamIntegrationWithoutCredentials($tenant);

        $this->mock(BunnyStreamInterface::class)
            ->shouldReceive('getVideoStatus')
            ->andThrow(new \RuntimeException('stream api unavailable'));

        $asset = MediaAsset::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'provider_service' => 'stream',
            'type' => 'video',
            'status' => 'ready',
            'visibility' => 'private',
            'external_id' => 'video-playback-1',
            'metadata' => [],
        ]);

        $data = app(MediaManager::class)
            ->providerFor('bunny', 'stream')
            ->getPlaybackData($asset);

        $this->assertSame('stream', $data['provider_service']);
        $this->assertSame('video-playback-1', $data['video_id']);
        $this->assertSame('https://platform.example.test/video-playback-1/playlist.m3u8', $data['playback_url']);
    }

    private function createPlatformStreamSettings(): void
    {
        PlatformBunnySetting::create([
            'storage_zone_name' => 'platform-zone',
            'storage_zone_password' => 'storage-password',
            'storage_zone_region' => 'de',
            'cdn_hostname' => 'platform.example.test',
            'library_id' => 'platform-lib-1',
            'api_key' => 'platform-api-key',
            'stream_api_key' => 'platform-stream-key',
            'enabled' => true,
            'connection_status' => 'connected',
            'enable_stream' => true,
        ]);
    }

    private function createStreamIntegrationWithoutCredentials(Tenant $tenant): void
    {
        TenantIntegration::create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'service' => 'stream',
            'status' => 'active',
            'config' => [
                'metadata' => ['region' => 'de'],
                'collection' => 'tenant-'.$tenant->id,
                'library_strategy' => 'platform',
            ],
        ]);
    }

    private function createBunnyStreamIntegration(Tenant $tenant, string $secret = 'test-secret'): void
    {
        TenantIntegration::create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'service' => 'stream',
            'status' => 'active',
            'external_id' => null,
            'config' => [
                'library_id' => 'library-'.$tenant->id,
                'collection_prefix' => 'tenant',
                'pull_zone' => 'stream-cdn.example.test',
                'api_region' => 'video',
                'status' => 'active',
                'client_upload_key' => 'upload-key',
                'webhook_secret' => $secret,
            ],
        ]);
    }

    private function memberWithRole(Tenant $tenant, string $roleSlug): TenantUser
    {
        $this->seedTenantPermissions($tenant);

        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'active',
        ]);

        $role = Role::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', $roleSlug)
            ->firstOrFail();

        $membership->roles()->attach($role->id, ['tenant_id' => $tenant->id]);

        return $membership->load('user');
    }

    private function seedTenantPermissions(Tenant $tenant): void
    {
        if (Role::query()->where('tenant_id', $tenant->id)->exists()) {
            return;
        }

        $this->seed(IdentityAccessSeeder::class);

        if (! Permission::query()->where('slug', 'courses.update')->exists()) {
            $this->fail('Course permissions were not seeded.');
        }
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createCourse(Tenant $tenant, array $overrides = []): Course
    {
        $this->bindTenant($tenant);

        return Course::withoutGlobalScopes()->create(array_merge([
            'tenant_id' => $tenant->id,
            'title' => 'Stream Course',
            'slug' => 'stream-course-'.uniqid(),
            'status' => 'draft',
            'visibility' => 'private',
            'pricing_type' => 'free',
        ], $overrides));
    }

    /**
     * @return array<string, string>
     */
    private function tenantHeader(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, string>
     */
    private function webhookHeaders(array $payload, string $secret): array
    {
        return [
            'X-Bunny-Signature' => hash_hmac('sha256', json_encode($payload), $secret),
        ];
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->forgetInstance(Tenant::class);
        app()->forgetInstance('currentTenant');
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
