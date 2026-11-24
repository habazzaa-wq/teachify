<?php

namespace Tests\Feature;

use App\Http\Middleware\IdentifyTenant;
use App\Models\Tenant;
use App\Models\TenantDomain;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class WwwTenantAliasTest extends TestCase
{
    use RefreshDatabase;

    public function test_by_domain_resolves_www_alias_to_same_tenant_and_canonical_domain(): void
    {
        $tenant = $this->tenantWithDomain('geo-top.academy.test');

        $this->getJson('/api/v1/tenant/by-domain?domain=www.geo-top.academy.test')
            ->assertOk()
            ->assertJsonPath('id', $tenant->id)
            ->assertJsonPath('domain', 'geo-top.academy.test');
    }

    public function test_by_domain_resolves_non_www_alias_for_registered_www_domain(): void
    {
        $tenant = $this->tenantWithDomain('www.custom.academy.test');

        $this->getJson('/api/v1/tenant/by-domain?domain=custom.academy.test')
            ->assertOk()
            ->assertJsonPath('id', $tenant->id)
            ->assertJsonPath('domain', 'www.custom.academy.test');
    }

    public function test_identify_tenant_middleware_accepts_www_forwarded_host(): void
    {
        $tenant = $this->tenantWithDomain('geo-top.academy.test');

        $request = Request::create('/api/v1/exams', 'GET');
        $request->headers->set('X-Forwarded-Host', 'www.geo-top.academy.test');

        $middleware = $this->app->make(IdentifyTenant::class);
        $response = $middleware->handle($request, fn (Request $r) => response()->json(['ok' => true]));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame($tenant->id, app('currentTenant')->id);
    }

    private function tenantWithDomain(string $domain): Tenant
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);

        TenantDomain::create([
            'tenant_id' => $tenant->id,
            'domain' => $domain,
            'type' => 'platform_subdomain',
            'status' => 'active',
            'is_primary' => true,
        ]);

        return $tenant;
    }
}
