<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IdentityAccessFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_identity_access_seeder_creates_global_permissions_and_tenant_roles(): void
    {
        $tenant = Tenant::factory()->create();

        $this->seed(IdentityAccessSeeder::class);

        $this->assertDatabaseHas('permissions', ['slug' => 'users.invite']);
        $this->assertDatabaseHas('roles', [
            'tenant_id' => $tenant->id,
            'slug' => 'tenant_owner',
        ]);

        $tenantOwner = Role::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', 'tenant_owner')
            ->firstOrFail();

        $this->assertTrue(
            $tenantOwner->permissions()
                ->where('permissions.slug', 'tenant.manage')
                ->exists(),
        );
    }

    public function test_global_user_can_have_memberships_in_multiple_tenants(): void
    {
        $user = User::factory()->create();
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();

        TenantUser::factory()->create([
            'tenant_id' => $firstTenant->id,
            'user_id' => $user->id,
        ]);
        TenantUser::factory()->create([
            'tenant_id' => $secondTenant->id,
            'user_id' => $user->id,
        ]);

        $this->assertSame(2, $user->memberships()->count());
        $this->assertSame(2, $user->tenants()->count());
    }

    public function test_authorization_service_checks_permissions_for_active_membership(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create();
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        $permission = Permission::firstOrCreate(
            ['slug' => 'courses.create'],
            ['name' => 'Courses Create', 'description' => null],
        );
        $role = Role::factory()->create([
            'tenant_id' => $tenant->id,
            'slug' => 'instructor',
        ]);

        $role->permissions()->attach($permission->id);
        $membership->roles()->attach($role->id, ['tenant_id' => $tenant->id]);

        $service = app(TenantAuthorizationService::class);

        $this->assertTrue($service->hasActiveMembership($user, $tenant));
        $this->assertTrue($service->hasRole($user, $tenant, 'instructor'));
        $this->assertTrue($service->hasPermission($user, $tenant, 'courses.create'));
        $this->assertFalse($service->hasPermission($user, $tenant, 'users.manage'));
    }

    public function test_cross_tenant_role_assignment_is_rejected(): void
    {
        $membershipTenant = Tenant::factory()->create();
        $roleTenant = Tenant::factory()->create();
        $membership = TenantUser::factory()->create([
            'tenant_id' => $membershipTenant->id,
        ]);
        $role = Role::factory()->create([
            'tenant_id' => $roleTenant->id,
        ]);

        $this->expectException(QueryException::class);

        $membership->roles()->attach($role->id, ['tenant_id' => $membershipTenant->id]);
    }
}
