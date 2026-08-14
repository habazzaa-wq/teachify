<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantDomain;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlatformDomainCheckTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.platform.domain_check_secret' => 'test-secret']);
    }

    public function test_domain_check_approves_active_tenant_domain(): void
    {
        $tenant = Tenant::factory()->create();
        TenantDomain::create([
            'tenant_id' => $tenant->id,
            'domain' => 'acme.teachify.test',
            'subdomain' => 'acme',
            'type' => 'platform_subdomain',
            'status' => 'active',
            'is_primary' => true,
        ]);

        $this->getJson('/api/v1/platform/domain-check?secret=test-secret&domain=acme.teachify.test')
            ->assertOk()
            ->assertJsonPath('tenant_id', $tenant->id);
    }

    public function test_domain_check_rejects_unknown_domain(): void
    {
        $this->getJson('/api/v1/platform/domain-check?secret=test-secret&domain=unknown.teachify.test')
            ->assertNotFound();
    }

    public function test_domain_check_requires_valid_secret(): void
    {
        $this->getJson('/api/v1/platform/domain-check?secret=wrong-secret&domain=unknown.teachify.test')
            ->assertForbidden();
    }
}
