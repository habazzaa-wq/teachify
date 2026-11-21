<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantServiceImageUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_upload_a_service_image_to_tenant_scoped_storage(): void
    {
        Storage::fake('public');
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_services' => true]]);
        $this->authenticateAdmin($tenant);

        $response = $this->withHeaders(['X-Tenant-ID' => (string) $tenant->id])
            ->post('/api/v1/services/upload-image', [
                'file' => UploadedFile::fake()->image('service-cover.png')->size(400),
            ])
            ->assertCreated()
            ->assertJsonPath('data.filename', 'service-cover.png');

        $url = $response->json('data.url');
        $this->assertMatchesRegularExpression(
            '#^/storage/services/'.$tenant->id.'/[0-9A-HJKMNP-TV-Z]{26}\.png$#',
            $url,
        );
        Storage::disk('public')->assertExists(substr($url, strlen('/storage/')));
    }

    public function test_service_image_upload_rejects_non_image_files(): void
    {
        Storage::fake('public');
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_services' => true]]);
        $this->authenticateAdmin($tenant);

        $this->withHeaders(['X-Tenant-ID' => (string) $tenant->id])
            ->post('/api/v1/services/upload-image', [
                'file' => UploadedFile::fake()->create('notes.txt', 100, 'text/plain'),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');

        Storage::disk('public')->assertDirectoryEmpty('services/'.$tenant->id);
    }

    public function test_service_image_upload_is_unavailable_when_feature_is_disabled(): void
    {
        Storage::fake('public');
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_services' => false]]);
        $this->authenticateAdmin($tenant);

        $this->withHeaders(['X-Tenant-ID' => (string) $tenant->id])
            ->post('/api/v1/services/upload-image', [
                'file' => UploadedFile::fake()->image('service-cover.jpg')->size(400),
            ])
            ->assertNotFound();
    }

    private function authenticateAdmin(Tenant $tenant): TenantUser
    {
        $user = User::factory()->create();
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        $role = Role::query()->firstOrCreate(
            ['tenant_id' => $tenant->id, 'slug' => 'tenant_owner'],
            ['name' => 'Tenant Owner'],
        );
        $membership->roles()->attach($role, ['tenant_id' => $tenant->id]);

        $permission = Permission::firstOrCreate(
            ['slug' => 'tenant.manage'],
            ['name' => 'Tenant Manage', 'description' => null],
        );
        $role->permissions()->sync([$permission->id]);

        Sanctum::actingAs($user);

        return $membership;
    }
}
