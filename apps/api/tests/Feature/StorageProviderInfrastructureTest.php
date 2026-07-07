<?php

namespace Tests\Feature;

use App\Models\MediaAsset;
use App\Models\MediaUploadSession;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantIntegration;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Media\MediaManager;
use App\Services\Media\Providers\BunnyStorageProvider;
use App\Services\Media\StoragePathGenerator;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StorageProviderInfrastructureTest extends TestCase
{
    use RefreshDatabase;

    public function test_upload_intent_creates_pending_asset_session_and_generated_storage_key(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $this->createBunnyStorageIntegration($tenant);

        Sanctum::actingAs($admin->user);

        $response = $this->postJson('/api/v1/media/upload-intents', [
            'type' => 'document',
            'storage_root' => 'lessons',
            'original_filename' => '../Unsafe File.PDF',
            'mime_type' => 'application/pdf',
            'size_bytes' => 1024,
            'visibility' => 'private',
        ], $this->tenantHeader($tenant));

        $response
            ->assertCreated()
            ->assertJsonPath('asset.status', 'pending')
            ->assertJsonPath('asset.provider', 'bunny')
            ->assertJsonPath('asset.provider_service', 'storage')
            ->assertJsonPath('upload_session.status', 'draft')
            ->assertJsonPath('intent.provider_service', 'storage');

        $storageKey = $response->json('asset.storage_key');
        $this->assertStringStartsWith("tenants/{$tenant->id}/lessons/unsafe-file-", $storageKey);
        $this->assertStringEndsWith('.pdf', $storageKey);
        $this->assertStringContainsString($storageKey, $response->json('intent.upload_url'));
    }

    public function test_storage_path_generator_rejects_invalid_roots(): void
    {
        $this->expectException(\Illuminate\Validation\ValidationException::class);

        app(StoragePathGenerator::class)->generate(Tenant::factory()->make(['id' => 10]), 'other', 'file.pdf');
    }

    public function test_confirm_upload_marks_asset_ready_and_session_completed(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $this->createBunnyStorageIntegration($tenant);

        Sanctum::actingAs($admin->user);

        $intent = $this->postJson('/api/v1/media/upload-intents', [
            'type' => 'image',
            'storage_root' => 'assets',
            'original_filename' => 'cover.png',
            'mime_type' => 'image/png',
        ], $this->tenantHeader($tenant))
            ->assertCreated();

        $sessionId = $intent->json('upload_session.id');
        $assetId = $intent->json('asset.id');

        $this->postJson("/api/v1/media/upload-intents/{$sessionId}/confirm", [
            'external_id' => 'bunny-object-id',
            'size_bytes' => 2048,
            'checksum' => 'sha256:abc',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('asset.status', 'ready')
            ->assertJsonPath('asset.external_id', 'bunny-object-id')
            ->assertJsonPath('upload_session.status', 'completed');

        $this->assertDatabaseHas('media_assets', [
            'id' => $assetId,
            'status' => 'ready',
            'external_id' => 'bunny-object-id',
        ]);
    }

    public function test_asset_status_and_deletion_use_registered_provider(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $this->createBunnyStorageIntegration($tenant);

        Sanctum::actingAs($admin->user);

        $assetId = $this->postJson('/api/v1/media/upload-intents', [
            'type' => 'attachment',
            'storage_root' => 'assets',
            'original_filename' => 'handout.zip',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('asset.id');

        $this->getJson("/api/v1/media/assets/{$assetId}/status", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('provider.provider', 'bunny')
            ->assertJsonPath('provider.status', 'pending');

        $this->deleteJson("/api/v1/media/assets/{$assetId}", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('asset.status', 'deleted');
    }

    public function test_bunny_storage_provider_is_registered(): void
    {
        $manager = app(MediaManager::class);

        $this->assertTrue($manager->hasProvider('bunny'));
        $this->assertInstanceOf(BunnyStorageProvider::class, $manager->provider('bunny'));
    }

    public function test_cross_tenant_upload_session_and_asset_access_is_rejected(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $firstAdmin = $this->memberWithRole($firstTenant, 'admin');
        $secondAdmin = $this->memberWithRole($secondTenant, 'admin');
        $this->createBunnyStorageIntegration($firstTenant);
        $this->createBunnyStorageIntegration($secondTenant);

        Sanctum::actingAs($firstAdmin->user);

        $intent = $this->postJson('/api/v1/media/upload-intents', [
            'type' => 'document',
            'storage_root' => 'assets',
            'original_filename' => 'tenant-one.pdf',
        ], $this->tenantHeader($firstTenant))
            ->assertCreated();

        $assetId = $intent->json('asset.id');
        $sessionId = $intent->json('upload_session.id');

        Sanctum::actingAs($secondAdmin->user);

        $this->postJson("/api/v1/media/upload-intents/{$sessionId}/confirm", [], $this->tenantHeader($secondTenant))
            ->assertNotFound();

        $this->getJson("/api/v1/media/assets/{$assetId}/status", $this->tenantHeader($secondTenant))
            ->assertNotFound();

        $this->deleteJson("/api/v1/media/assets/{$assetId}", [], $this->tenantHeader($secondTenant))
            ->assertNotFound();
    }

    public function test_students_cannot_create_upload_intents(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->createBunnyStorageIntegration($tenant);

        Sanctum::actingAs($student->user);

        $this->postJson('/api/v1/media/upload-intents', [
            'type' => 'document',
            'storage_root' => 'assets',
            'original_filename' => 'denied.pdf',
        ], $this->tenantHeader($tenant))
            ->assertForbidden();
    }

    private function createBunnyStorageIntegration(Tenant $tenant): void
    {
        TenantIntegration::create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'service' => 'storage',
            'status' => 'active',
            'external_id' => null,
            'config' => [
                'zone' => 'test-zone',
                'upload_base_url' => 'https://storage.example.test/test-zone',
                'cdn_base_url' => 'https://cdn.example.test',
                'client_upload_key' => 'test-client-key',
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
     * @return array<string, string>
     */
    private function tenantHeader(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
    }
}
