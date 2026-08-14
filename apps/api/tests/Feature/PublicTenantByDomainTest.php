<?php

namespace Tests\Feature;

use App\Models\MediaAsset;
use App\Models\SeoSetting;
use App\Models\Tenant;
use App\Models\TenantDomain;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicTenantByDomainTest extends TestCase
{
    use RefreshDatabase;

    public function test_by_domain_returns_branding_and_seo_settings(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);

        TenantDomain::create([
            'tenant_id' => $tenant->id,
            'domain' => 'noor.academy.test',
            'type' => 'custom',
            'status' => 'active',
            'is_primary' => true,
        ]);

        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);

        $ogImage = $this->createImageAsset($tenant, 'https://cdn.example.com/og-default.png');

        SeoSetting::create([
            'default_title_template' => '%s | أكاديمية النور',
            'default_description' => 'منصة تعليمية متكاملة لتعلم الرياضيات.',
            'homepage_title' => 'أكاديمية النور — تعلم الرياضيات بسهولة',
            'homepage_description' => 'وصف الصفحة الرئيسية لأكاديمية النور.',
            'organization_name' => 'أكاديمية النور للمناهج',
            'organization_description' => 'مؤسسة تعليمية متخصصة في تدريس الرياضيات.',
            'social_profiles' => ['https://facebook.com/noor', 'https://twitter.com/noor'],
            'default_robots_policy' => 'index_follow',
            'sitemap_include_default' => true,
            'default_og_image_asset_id' => $ogImage->id,
        ]);

        $response = $this->getJson('/api/v1/tenant/by-domain?domain=noor.academy.test');

        $response->assertOk()
            ->assertJsonPath('name', $tenant->name)
            ->assertJsonPath('status', 'active')
            ->assertJsonPath('branding.logo', $tenant->branding['logo'] ?? null)
            ->assertJsonPath('seo.titleTemplate', '%s | أكاديمية النور')
            ->assertJsonPath('seo.description', 'منصة تعليمية متكاملة لتعلم الرياضيات.')
            ->assertJsonPath('seo.homepageTitle', 'أكاديمية النور — تعلم الرياضيات بسهولة')
            ->assertJsonPath('seo.homepageDescription', 'وصف الصفحة الرئيسية لأكاديمية النور.')
            ->assertJsonPath('seo.organizationName', 'أكاديمية النور للمناهج')
            ->assertJsonPath('seo.organizationDescription', 'مؤسسة تعليمية متخصصة في تدريس الرياضيات.')
            ->assertJsonPath('seo.socialProfiles', [
                'https://facebook.com/noor',
                'https://twitter.com/noor',
            ])
            ->assertJsonPath('seo.robotsPolicy', 'index_follow')
            ->assertJsonPath('seo.sitemapIncludeDefault', true)
            ->assertJsonPath('seo.ogImage', 'https://cdn.example.com/og-default.png');
    }

    public function test_by_domain_returns_null_seo_when_no_settings_exist(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);

        TenantDomain::create([
            'tenant_id' => $tenant->id,
            'domain' => 'empty.academy.test',
            'type' => 'custom',
            'status' => 'active',
            'is_primary' => true,
        ]);

        $this->getJson('/api/v1/tenant/by-domain?domain=empty.academy.test')
            ->assertOk()
            ->assertJsonPath('seo', null);
    }

    public function test_by_domain_does_not_leak_other_tenant_settings(): void
    {
        $tenantA = Tenant::factory()->create(['status' => 'active']);
        $tenantB = Tenant::factory()->create(['status' => 'active']);

        TenantDomain::create([
            'tenant_id' => $tenantA->id,
            'domain' => 'a.academy.test',
            'type' => 'custom',
            'status' => 'active',
            'is_primary' => true,
        ]);
        TenantDomain::create([
            'tenant_id' => $tenantB->id,
            'domain' => 'b.academy.test',
            'type' => 'custom',
            'status' => 'active',
            'is_primary' => true,
        ]);

        app()->instance(Tenant::class, $tenantB);
        app()->instance('currentTenant', $tenantB);

        SeoSetting::create([
            'organization_name' => 'مؤسسة B السرية',
            'homepage_title' => 'منصة B',
        ]);

        $response = $this->getJson('/api/v1/tenant/by-domain?domain=a.academy.test');

        $response->assertOk()
            ->assertJsonPath('name', $tenantA->name)
            ->assertJsonPath('seo', null);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private function createImageAsset(Tenant $tenant, ?string $cdnUrl): MediaAsset
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);

        return MediaAsset::create([
            'provider' => 'local',
            'provider_service' => 'local',
            'type' => 'image',
            'status' => 'ready',
            'visibility' => 'private',
            'metadata' => [],
            'original_name' => 'image.png',
            'mime_type' => 'image/png',
            'size_bytes' => 1024,
            'cdn_url' => $cdnUrl,
        ]);
    }
}
