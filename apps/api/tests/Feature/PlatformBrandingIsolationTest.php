<?php

namespace Tests\Feature;

use App\Models\PlatformBranding;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PlatformBrandingIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_by_domain_returns_tenant_specific_platform_branding(): void
    {
        $tenantA = Tenant::factory()->create(['status' => 'active']);
        $tenantB = Tenant::factory()->create(['status' => 'active']);

        TenantDomain::create([
            'tenant_id' => $tenantA->id,
            'domain' => 'a-platform.academy.test',
            'type' => 'custom',
            'status' => 'active',
            'is_primary' => true,
        ]);
        TenantDomain::create([
            'tenant_id' => $tenantB->id,
            'domain' => 'b-platform.academy.test',
            'type' => 'custom',
            'status' => 'active',
            'is_primary' => true,
        ]);

        PlatformBranding::create([
            'tenant_id' => $tenantA->id,
            'primary_color' => '#FF0000',
            'secondary_color' => '#00FF00',
            'name' => 'Tenant A Brand',
        ]);
        PlatformBranding::create([
            'tenant_id' => $tenantB->id,
            'primary_color' => '#0000FF',
            'secondary_color' => '#FF00FF',
            'name' => 'Tenant B Brand',
        ]);

        $responseA = $this->getJson('/api/v1/tenant/by-domain?domain=a-platform.academy.test');
        $responseB = $this->getJson('/api/v1/tenant/by-domain?domain=b-platform.academy.test');

        $responseA->assertOk()
            ->assertJsonPath('name', $tenantA->name)
            ->assertJsonPath('platform_branding.primaryColor', '#FF0000')
            ->assertJsonPath('platform_branding.secondaryColor', '#00FF00')
            ->assertJsonPath('platform_branding.name', 'Tenant A Brand');

        $responseB->assertOk()
            ->assertJsonPath('name', $tenantB->name)
            ->assertJsonPath('platform_branding.primaryColor', '#0000FF')
            ->assertJsonPath('platform_branding.secondaryColor', '#FF00FF')
            ->assertJsonPath('platform_branding.name', 'Tenant B Brand');
    }

    public function test_update_platform_branding_only_affects_current_tenant(): void
    {
        $tenantA = Tenant::factory()->create(['status' => 'active']);
        $tenantB = Tenant::factory()->create(['status' => 'active']);

        $tenantADomain = TenantDomain::create([
            'tenant_id' => $tenantA->id,
            'domain' => 'update-test-a.academy.test',
            'type' => 'custom',
            'status' => 'active',
            'is_primary' => true,
        ]);

        TenantDomain::create([
            'tenant_id' => $tenantB->id,
            'domain' => 'update-test-b.academy.test',
            'type' => 'custom',
            'status' => 'active',
            'is_primary' => true,
        ]);

        PlatformBranding::create([
            'tenant_id' => $tenantA->id,
            'primary_color' => '#AAAAAA',
            'secondary_color' => '#BBBBBB',
        ]);
        PlatformBranding::create([
            'tenant_id' => $tenantB->id,
            'primary_color' => '#CCCCCC',
            'secondary_color' => '#DDDDDD',
        ]);

        // Create a teacher user in tenant A
        $user = User::factory()->create();
        TenantUser::factory()->create([
            'tenant_id' => $tenantA->id,
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        Sanctum::actingAs($user);

        // The middleware resolves the tenant from the X-Tenant-ID header (which is
        // how the frontend axios layer sends it in production).
        $this->putJson('/api/v1/settings/platform', [
            'primary_color' => '#123456',
            'secondary_color' => '#654321',
            'name' => 'A Updated',
        ], ['X-Tenant-ID' => $tenantA->id])
            ->assertOk();

        $aBranding = PlatformBranding::query()->where('tenant_id', $tenantA->id)->first();
        $bBranding = PlatformBranding::query()->where('tenant_id', $tenantB->id)->first();

        $this->assertNotNull($aBranding);
        $this->assertNotNull($bBranding);

        $this->assertEquals('#123456', $aBranding->primary_color);
        $this->assertEquals('#654321', $aBranding->secondary_color);
        $this->assertEquals('A Updated', $aBranding->name);

        // Tenant B's branding must NOT be affected
        $this->assertEquals('#CCCCCC', $bBranding->primary_color);
        $this->assertEquals('#DDDDDD', $bBranding->secondary_color);
    }

    public function test_by_domain_returns_empty_platform_branding_when_tenant_has_no_customization(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);

        TenantDomain::create([
            'tenant_id' => $tenant->id,
            'domain' => 'uncustomized.academy.test',
            'type' => 'custom',
            'status' => 'active',
            'is_primary' => true,
        ]);

        $this->getJson('/api/v1/tenant/by-domain?domain=uncustomized.academy.test')
            ->assertOk()
            ->assertJsonPath('platform_branding.primaryColor', null);
    }
}
