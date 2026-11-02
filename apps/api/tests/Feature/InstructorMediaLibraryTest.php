<?php

namespace Tests\Feature;

use App\Models\MediaAsset;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstructorMediaLibraryTest extends TestCase
{
    use RefreshDatabase;

    public function test_instructor_media_library_only_lists_and_opens_assets_they_uploaded(): void
    {
        $tenant = Tenant::factory()->create([
            'feature_flags' => ['has_instructors' => true],
        ]);
        $role = Role::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Instructor',
            'slug' => 'instructor',
        ]);
        [$instructor, $membership] = $this->createInstructor($tenant, $role);
        [, $otherMembership] = $this->createInstructor($tenant, $role);
        $ownAsset = $this->createAsset($tenant, $membership);
        $otherAsset = $this->createAsset($tenant, $otherMembership);
        $token = $instructor->createToken('instructor_access_token', [
            'instructor:access',
            'instructor:tenant:'.$tenant->id,
        ])->plainTextToken;
        $headers = [
            'Authorization' => 'Bearer '.$token,
            'X-Tenant-ID' => (string) $tenant->id,
        ];

        $this->getJson('/api/v1/instructor/media-library/assets', $headers)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownAsset->id);

        $this->getJson('/api/v1/instructor/media-library/assets/'.$otherAsset->id, $headers)
            ->assertNotFound();

        $this->getJson('/api/v1/instructor/media-library/metrics', $headers)
            ->assertOk()
            ->assertJsonPath('data.totalAssets', 1);

        $this->deleteJson('/api/v1/instructor/media-library/assets/'.$otherAsset->id, [], $headers)
            ->assertNotFound();

        $this->postJson('/api/v1/instructor/media-library/assets/bulk/delete', [
            'ids' => [$ownAsset->id, $otherAsset->id],
        ], $headers)->assertNotFound();

        $this->assertDatabaseHas('media_assets', ['id' => $ownAsset->id]);
        $this->assertDatabaseHas('media_assets', ['id' => $otherAsset->id]);
    }

    private function createInstructor(Tenant $tenant, Role $role): array
    {
        $user = User::factory()->create();
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'is_instructor' => true,
            'must_change_password' => false,
        ]);
        $membership->roles()->attach($role, ['tenant_id' => $tenant->id]);

        return [$user, $membership];
    }

    private function createAsset(Tenant $tenant, TenantUser $membership): MediaAsset
    {
        return MediaAsset::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $membership->id,
            'uploader_id' => $membership->id,
            'provider' => 'local',
            'provider_service' => 'storage',
            'type' => 'image',
            'source' => 'upload',
            'status' => 'ready',
            'processing_status' => 'ready',
            'visibility' => 'private',
            'storage_key' => 'instructor/'.$membership->id.'/image.jpg',
            'original_filename' => 'image.jpg',
            'title' => 'Instructor image',
            'mime_type' => 'image/jpeg',
            'extension' => 'jpg',
            'size_bytes' => 100,
            'size' => 100,
            'cdn_url' => 'https://cdn.example.test/image.jpg',
            'metadata' => [],
        ]);
    }
}
