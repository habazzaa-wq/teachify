<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicServiceShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_a_published_service_for_the_active_tenant(): void
    {
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_services' => true]]);
        $service = $this->createService($tenant, ['title' => 'استشارة تعليمية', 'is_published' => true]);

        $this->withHeaders(['X-Tenant-ID' => (string) $tenant->id])
            ->getJson("/api/v1/public/services/{$service->id}")
            ->assertOk()
            ->assertJsonPath('service.id', $service->id)
            ->assertJsonPath('service.title', 'استشارة تعليمية')
            ->assertJsonPath('service.is_published', true);
    }

    public function test_it_does_not_expose_an_unpublished_service(): void
    {
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_services' => true]]);
        $service = $this->createService($tenant, ['is_published' => false]);

        $this->withHeaders(['X-Tenant-ID' => (string) $tenant->id])
            ->getJson("/api/v1/public/services/{$service->id}")
            ->assertNotFound();
    }

    public function test_it_does_not_expose_another_tenants_service(): void
    {
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_services' => true]]);
        $otherTenant = Tenant::factory()->create(['feature_flags' => ['has_services' => true]]);
        $service = $this->createService($otherTenant, ['is_published' => true]);

        $this->withHeaders(['X-Tenant-ID' => (string) $tenant->id])
            ->getJson("/api/v1/public/services/{$service->id}")
            ->assertNotFound();
    }

    public function test_it_is_unavailable_when_the_feature_is_disabled(): void
    {
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_services' => false]]);
        $service = $this->createService($tenant, ['is_published' => true]);

        $this->withHeaders(['X-Tenant-ID' => (string) $tenant->id])
            ->getJson("/api/v1/public/services/{$service->id}")
            ->assertNotFound();
    }

    private function createService(Tenant $tenant, array $overrides = []): TenantService
    {
        return TenantService::create(array_merge([
            'tenant_id' => $tenant->id,
            'title' => 'خدمة تجريبية',
            'summary' => 'ملخص الخدمة',
            'description' => 'وصف الخدمة',
            'highlights' => ['ميزة أولى', 'ميزة ثانية'],
            'contact_name' => 'مقدم الخدمة',
            'contact_phone' => '201011245565',
            'sort_order' => 0,
            'is_published' => true,
        ], $overrides));
    }
}
