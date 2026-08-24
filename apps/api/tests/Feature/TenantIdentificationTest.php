<?php

namespace Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIdentificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_requests_without_tenant_header_are_rejected(): void
    {
        $this->getJson('/api/v1/health')
            ->assertNotFound()
            ->assertJson(['message' => 'Tenant not found or inactive.']);
    }

    public function test_api_requests_with_unknown_tenant_are_rejected(): void
    {
        $this->getJson('/api/v1/health', ['X-Tenant-ID' => '999'])
            ->assertNotFound()
            ->assertJson(['message' => 'Tenant not found or inactive.']);
    }

    public function test_api_requests_with_inactive_tenant_are_rejected(): void
    {
        $tenant = Tenant::create([
            'name' => 'Inactive Tenant',
            'slug' => 'inactive-tenant',
            'status' => 'inactive',
        ]);

        $this->getJson('/api/v1/health', ['X-Tenant-ID' => (string) $tenant->id])
            ->assertNotFound()
            ->assertJson(['message' => 'Tenant not found or inactive.']);
    }

    public function test_api_requests_with_active_tenant_are_allowed(): void
    {
        $tenant = Tenant::create([
            'name' => 'Active Tenant',
            'slug' => 'active-tenant',
            'status' => 'active',
        ]);

        $this->getJson('/api/v1/health', ['X-Tenant-ID' => (string) $tenant->id])
            ->assertOk()
            ->assertJson(['status' => 'ok']);
    }
}
