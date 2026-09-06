<?php

namespace Tests\Feature;

use App\Models\PlatformAdmin;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\TenantSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PlatformTenantProvisioningTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_super_admin_can_create_tenant_bootstrap_foundation(): void
    {
        $platformAdmin = User::factory()->create();
        PlatformAdmin::factory()->create(['user_id' => $platformAdmin->id]);

        Sanctum::actingAs($platformAdmin);

        $response = $this->postJson('/api/v1/platform/tenants', [
            'academy_name' => 'Acme Academy',
            'academy_slug' => 'acme-academy',
            'owner_name' => 'Acme Owner',
            'owner_email' => ' OWNER@Acme.test ',
            'owner_password' => 'password123',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('tenant.slug', 'acme-academy')
            ->assertJsonPath('tenant.status', 'active')
            ->assertJsonPath('owner.email', 'owner@acme.test')
            ->assertJsonPath('membership.status', 'active');

        $tenant = Tenant::query()->where('slug', 'acme-academy')->firstOrFail();
        $owner = User::query()->where('email', 'owner@acme.test')->firstOrFail();
        $membership = $owner->memberships()->where('tenant_id', $tenant->id)->firstOrFail();

        $this->assertDatabaseHas('tenants', [
            'id' => $tenant->id,
            'status' => 'active',
        ]);
        $this->assertTrue($membership->roles()->where('roles.slug', 'tenant_owner')->exists());
    }

    public function test_tenant_creation_creates_default_roles_and_permissions(): void
    {
        $tenant = $this->createTenantThroughPlatform();

        $this->assertSame(
            ['admin', 'instructor', 'student', 'tenant_owner'],
            Role::query()->where('tenant_id', $tenant->id)->orderBy('slug')->pluck('slug')->all(),
        );

        $ownerRole = Role::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', 'tenant_owner')
            ->firstOrFail();

        $this->assertTrue($ownerRole->permissions()->where('permissions.slug', 'tenant.manage')->exists());
        $this->assertTrue($ownerRole->permissions()->where('permissions.slug', 'users.manage')->exists());
    }

    public function test_tenant_creation_creates_default_settings_domain_integrations_and_steps(): void
    {
        $tenant = $this->createTenantThroughPlatform();

        $this->assertSame(
            ['branding', 'enrollment', 'locale', 'notifications', 'profile', 'setup', 'storage', 'video'],
            TenantSetting::query()->where('tenant_id', $tenant->id)->orderBy('group')->pluck('group')->all(),
        );

        $this->assertDatabaseHas('tenant_domains', [
            'tenant_id' => $tenant->id,
            'domain' => 'acme-academy.platform-domain',
            'type' => 'platform_subdomain',
            'status' => 'active',
            'is_primary' => true,
        ]);

        $this->assertSame(2, $tenant->integrations()->where('provider', 'bunny')->where('status', 'pending')->count());

        $this->assertSame(
            [
                'domain_created',
                'owner_created',
                'permissions_attached',
                'roles_created',
                'settings_created',
                'tenant_created',
            ],
            $tenant->provisioningSteps()->orderBy('step')->pluck('step')->all(),
        );
    }

    public function test_platform_tenant_list_and_show_require_platform_super_admin(): void
    {
        $user = User::factory()->create();
        $tenant = Tenant::factory()->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/platform/tenants')->assertForbidden();
        $this->getJson("/api/v1/platform/tenants/{$tenant->id}")->assertForbidden();
        $this->postJson('/api/v1/platform/tenants', [
            'academy_name' => 'Denied Academy',
            'academy_slug' => 'denied-academy',
            'owner_name' => 'Denied Owner',
            'owner_email' => 'denied@example.test',
            'owner_password' => 'password123',
        ])->assertForbidden();
    }

    public function test_platform_super_admin_can_list_and_show_tenants_without_tenant_header(): void
    {
        $platformAdmin = User::factory()->create();
        PlatformAdmin::factory()->create(['user_id' => $platformAdmin->id]);
        $tenant = Tenant::factory()->create(['name' => 'Visible Academy']);
        TenantDomain::create([
            'tenant_id' => $tenant->id,
            'domain' => 'visible.platform-domain',
            'type' => 'platform_subdomain',
            'status' => 'active',
            'is_primary' => true,
        ]);

        Sanctum::actingAs($platformAdmin);

        $this->getJson('/api/v1/platform/tenants')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Visible Academy');

        $this->getJson("/api/v1/platform/tenants/{$tenant->id}")
            ->assertOk()
            ->assertJsonPath('tenant.id', $tenant->id);
    }

    private function createTenantThroughPlatform(): Tenant
    {
        $platformAdmin = User::factory()->create();
        PlatformAdmin::factory()->create(['user_id' => $platformAdmin->id]);

        Sanctum::actingAs($platformAdmin);

        $this->postJson('/api/v1/platform/tenants', [
            'academy_name' => 'Acme Academy',
            'academy_slug' => 'acme-academy',
            'owner_name' => 'Acme Owner',
            'owner_email' => 'owner@acme.test',
            'owner_password' => 'password123',
        ])->assertCreated();

        return Tenant::query()->where('slug', 'acme-academy')->firstOrFail();
    }
}
