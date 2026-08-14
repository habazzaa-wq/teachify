<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Authorization\AuthorizationService;
use App\Services\Platform\TenantCreationService;
use App\Support\DefaultRolePermissions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SyncDefaultRolePermissionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_tenant_owner_receives_full_permission_catalog(): void
    {
        $result = app(TenantCreationService::class)->create([
            'academy_name' => 'Acme Academy',
            'academy_slug' => 'acme-academy',
            'owner_name' => 'Acme Owner',
            'owner_email' => 'owner@example.com',
            'owner_password' => 'secret-password',
        ]);

        $tenant = $result['tenant'];
        $owner = $result['owner'];
        $authorization = app(AuthorizationService::class);

        $permissions = $authorization->getUserPermissions($owner, $tenant);

        $this->assertContains('media.view', $permissions);
        $this->assertContains('media.manage', $permissions);
        $this->assertContains('media.upload', $permissions);
        $this->assertContains('seo.view', $permissions);
        $this->assertContains('news.manage', $permissions);
        $this->assertContains('stages.manage', $permissions);
        $this->assertContains('tenant.manage', $permissions);

        $authorization->authorize($owner, 'media.view', $tenant);
        $this->assertTrue(true);
    }

    public function test_sync_backfills_sparse_tenant_roles(): void
    {
        $tenant = Tenant::factory()->create(['slug' => 'legacy-tenant']);
        $user = User::factory()->create();
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        $role = Role::factory()->create([
            'tenant_id' => $tenant->id,
            'slug' => 'tenant_owner',
            'name' => 'Tenant Owner',
        ]);
        $membership->roles()->attach($role->id, ['tenant_id' => $tenant->id]);

        $sparse = Permission::firstOrCreate(
            ['slug' => 'courses.view'],
            ['name' => 'Courses View', 'description' => null],
        );
        $role->permissions()->sync([$sparse->id]);

        $authorization = app(AuthorizationService::class);
        $this->assertFalse($authorization->hasPermission($user, 'media.view', $tenant));

        DefaultRolePermissions::syncAllTenants();

        $this->assertTrue($authorization->hasPermission($user, 'media.view', $tenant));
        $this->assertTrue($authorization->hasPermission($user, 'media.manage', $tenant));
        $this->assertTrue($authorization->hasPermission($user, 'tenant.manage', $tenant));
    }
}
