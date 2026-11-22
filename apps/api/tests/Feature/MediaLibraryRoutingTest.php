<?php

namespace Tests\Feature;

use App\Models\MediaAsset;
use App\Models\MediaUploadSession;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantIntegration;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MediaLibraryRoutingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Storage::fake('uploads');
    }

    public function test_video_upload_intent_is_reserved_on_bunny_stream(): void
    {
        $tenant = $this->createTenant();
        $this->createBunnyStreamIntegration($tenant);
        $member = $this->memberWithRole($tenant, 'tenant_owner');
        Sanctum::actingAs($member->user);

        $response = $this->postJson('/api/v1/media-library/upload/resumable/intent', [
            'library' => 'videos',
            'type' => 'video',
            'original_filename' => 'lesson.mp4',
            'mime_type' => 'video/mp4',
            'size_bytes' => 1024,
        ], $this->tenantHeader($tenant));

        $response->assertCreated();
        $response->assertJsonPath('data.library', 'videos');
        $response->assertJsonPath('data.asset.type', 'video');
        $this->assertStringContainsString('/chunk', (string) $response->json('data.upload_url'));

        $asset = MediaAsset::findOrFail($response->json('data.asset.id'));
        $this->assertSame('bunny', $asset->provider);
        $this->assertSame('stream', $asset->provider_service);

        $session = MediaUploadSession::findOrFail($response->json('data.session_id'));
        $this->assertSame('bunny', $session->provider);
        $this->assertSame('stream', $session->provider_service);
    }

    public function test_direct_upload_intent_cannot_reserve_bunny_video_uploads(): void
    {
        $tenant = $this->createTenant();
        $this->createBunnyStreamIntegration($tenant);
        $member = $this->memberWithRole($tenant, 'tenant_owner');
        Sanctum::actingAs($member->user);

        $this->postJson('/api/v1/media-library/upload/intent', [
            'library' => 'videos',
            'type' => 'video',
            'original_filename' => 'lesson.mp4',
            'mime_type' => 'video/mp4',
        ], $this->tenantHeader($tenant))->assertStatus(422);

        $this->assertSame(0, MediaAsset::query()->where('tenant_id', $tenant->id)->count());
    }

    public function test_conflicting_mime_and_filename_signals_are_rejected(): void
    {
        $tenant = $this->createTenant();
        $member = $this->memberWithRole($tenant, 'tenant_owner');
        Sanctum::actingAs($member->user);

        // An image must not be routed to Bunny Stream because its name ends in .mp4.
        $this->postJson('/api/v1/media-library/upload/intent', [
            'library' => 'media',
            'type' => 'image',
            'original_filename' => 'poster.mp4',
            'mime_type' => 'image/png',
        ], $this->tenantHeader($tenant))->assertStatus(422);

        // A non-video MIME type must not create a Bunny video object either.
        $this->postJson('/api/v1/media-library/upload/intent', [
            'library' => 'videos',
            'type' => 'video',
            'original_filename' => 'lesson.png',
            'mime_type' => 'image/png',
        ], $this->tenantHeader($tenant))->assertStatus(422);

        // Missing MIME + non-video filename: `type=video` alone is not proof.
        $this->postJson('/api/v1/media-library/upload/intent', [
            'library' => 'videos',
            'type' => 'video',
            'original_filename' => 'photo.png',
        ], $this->tenantHeader($tenant))->assertStatus(422);

        // Generic MIME + video filename must not override a declared image type.
        $this->postJson('/api/v1/media-library/upload/intent', [
            'library' => 'videos',
            'type' => 'image',
            'original_filename' => 'clip.mp4',
            'mime_type' => 'application/octet-stream',
        ], $this->tenantHeader($tenant))->assertStatus(422);

        $this->assertSame(0, MediaAsset::query()->where('tenant_id', $tenant->id)->count());
    }

    public function test_video_files_are_rejected_by_the_media_library_upload_endpoint(): void
    {
        $tenant = $this->createTenant();
        $member = $this->memberWithRole($tenant, 'tenant_owner');
        Sanctum::actingAs($member->user);

        $this->post('/api/v1/media-library/upload/file', [
            'library' => 'media',
            'file' => UploadedFile::fake()->create('clip.mp4', 32, 'video/mp4'),
        ], $this->tenantHeader($tenant))->assertStatus(422);

        $this->assertSame(0, MediaAsset::query()->where('tenant_id', $tenant->id)->count());
    }

    public function test_non_video_direct_upload_is_written_to_local_storage(): void
    {
        $tenant = $this->createTenant();
        $member = $this->memberWithRole($tenant, 'tenant_owner');
        Sanctum::actingAs($member->user);

        $response = $this->post('/api/v1/media-library/upload/file', [
            'library' => 'media',
            'file' => UploadedFile::fake()->create('notes.pdf', 32, 'application/pdf'),
        ], $this->tenantHeader($tenant));

        $response->assertCreated();

        $asset = MediaAsset::findOrFail($response->json('data.asset.id'));
        $this->assertSame('local', $asset->provider);
        $this->assertSame('storage', $asset->provider_service);
        $this->assertSame('pdf', $asset->type);
        Storage::disk('public')->assertExists($asset->storage_key);
        $this->assertStringNotContainsString(
            '/api/v1/media/serve/',
            (string) $response->json('data.asset.cdnUrl'),
        );
    }

    public function test_local_confirm_requires_stored_bytes_and_ignores_client_url(): void
    {
        $tenant = $this->createTenant();
        $member = $this->memberWithRole($tenant, 'tenant_owner');
        Sanctum::actingAs($member->user);

        $intent = $this->postJson('/api/v1/media-library/upload/intent', [
            'library' => 'media',
            'type' => 'image',
            'original_filename' => 'poster.png',
            'mime_type' => 'image/png',
        ], $this->tenantHeader($tenant))->assertCreated()->json('data');

        $session = MediaUploadSession::findOrFail($intent['session_id']);

        $this->postJson("/api/v1/media-library/upload/{$session->id}/confirm", [
            'cdn_url' => 'https://attacker.example/pwn.png',
        ], $this->tenantHeader($tenant))->assertStatus(422);

        $bytes = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            true,
        );
        $this->call(
            'PUT',
            "/api/v1/media-library/upload/local/{$session->id}",
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'image/png',
                'CONTENT_LENGTH' => (string) strlen($bytes),
                'HTTP_X_TENANT_ID' => (string) $tenant->id,
            ],
            $bytes,
        )->assertOk();

        $this->postJson("/api/v1/media-library/upload/{$session->id}/confirm", [
            'cdn_url' => 'https://attacker.example/pwn.png',
        ], $this->tenantHeader($tenant))->assertOk();

        $asset = MediaAsset::findOrFail($intent['asset']['id']);
        $this->assertSame('ready', $asset->status);
        $this->assertStringNotContainsString('attacker.example', (string) $asset->cdn_url);
        $this->assertStringNotContainsString('/api/v1/media/serve/', (string) $asset->cdn_url);
    }

    public function test_list_filters_cannot_cross_library_boundaries(): void
    {
        $tenant = $this->createTenant();
        $member = $this->memberWithRole($tenant, 'tenant_owner');
        Sanctum::actingAs($member->user);

        $this->createAsset($tenant, $member, 'video', 'bunny', 'stream', 'lesson.mp4');
        $this->createAsset($tenant, $member, 'image', 'local', 'storage', 'poster.png');

        $this->getJson('/api/v1/media-library/assets?library=media&type=video', $this->tenantHeader($tenant))
            ->assertStatus(422);

        $this->getJson('/api/v1/media-library/assets?library=videos&types[]=image', $this->tenantHeader($tenant))
            ->assertStatus(422);

        $this->getJson('/api/v1/media-library/assets?library=media', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'image');

        $this->getJson('/api/v1/media-library/assets?library=videos', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'video');
    }

    private function createTenant(): Tenant
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);
        $tenant->forceFill(['plan' => ['name' => 'Test Plan', 'limits' => []]])->save();

        \App\Models\Usage\TenantUsage::create([
            'tenant_id' => $tenant->id,
            'storage_bytes' => 0,
            'bandwidth_bytes' => 0,
            'stream_bandwidth_bytes' => 0,
            'cdn_bandwidth_bytes' => 0,
            'requests' => 0,
            'views' => 0,
            'uploaded_files' => 0,
            'uploaded_videos' => 0,
            'collections' => 0,
            'folders' => 0,
        ]);

        return $tenant;
    }

    private function memberWithRole(Tenant $tenant, string $roleSlug): TenantUser
    {
        if (! Role::query()->where('tenant_id', $tenant->id)->exists()) {
            $this->seed(\Database\Seeders\IdentityAccessSeeder::class);
        }

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

    private function tenantHeader(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
    }

    private function createBunnyStreamIntegration(Tenant $tenant): void
    {
        TenantIntegration::create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'service' => 'stream',
            'status' => 'active',
            'external_id' => null,
            'config' => [
                'library_id' => 'library-'.$tenant->id,
                'api_region' => 'video',
                'client_upload_key' => 'upload-key',
                'webhook_secret' => 'test-secret',
            ],
        ]);
    }

    private function createAsset(
        Tenant $tenant,
        TenantUser $member,
        string $type,
        string $provider,
        string $service,
        string $filename,
    ): MediaAsset {
        return MediaAsset::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $member->id,
            'uploader_id' => $member->id,
            'provider' => $provider,
            'provider_service' => $service,
            'type' => $type,
            'status' => 'ready',
            'processing_status' => 'ready',
            'visibility' => 'private',
            'storage_key' => "tenants/{$tenant->id}/{$filename}",
            'original_filename' => $filename,
            'original_name' => $filename,
            'title' => pathinfo($filename, PATHINFO_FILENAME),
            'mime_type' => $type === 'video' ? 'video/mp4' : 'image/png',
            'size_bytes' => 1024,
            'metadata' => ['library' => $type === 'video' ? 'videos' : 'media'],
        ]);
    }
}
