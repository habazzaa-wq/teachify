<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicHeroTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_hero_defaults_identify_the_tenant_and_are_publicly_browsable(): void
    {
        $tenant = Tenant::factory()->create(['name' => 'Geo Top']);

        $this->getJson('/api/v1/public/hero', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('hero.title', 'مرحباً بكم في Geo Top')
            ->assertJsonPath('hero.subtitle', 'منصة Geo Top التعليمية — تصفّح المراحل والكورسات والمحتوى التعليمي دون تسجيل الدخول.');
    }

    public function test_saved_hero_copy_is_still_respected(): void
    {
        $tenant = Tenant::factory()->create(['name' => 'Geo Top']);

        TenantSetting::create([
            'tenant_id' => $tenant->id,
            'group' => 'homepage',
            'values' => [
                'hero' => [
                    'title' => 'أكاديمية النور',
                    'subtitle' => 'تعلم الرياضيات بسهولة',
                    'isActive' => true,
                ],
            ],
        ]);

        $this->getJson('/api/v1/public/hero', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('hero.title', 'أكاديمية النور')
            ->assertJsonPath('hero.subtitle', 'تعلم الرياضيات بسهولة');
    }

    public function test_explicitly_cleared_subtitle_stays_empty_instead_of_using_the_fallback(): void
    {
        $tenant = Tenant::factory()->create(['name' => 'Geo Top']);

        TenantSetting::create([
            'tenant_id' => $tenant->id,
            'group' => 'homepage',
            'values' => [
                'hero' => [
                    'title' => 'أكاديمية النور',
                    'subtitle' => '',
                ],
            ],
        ]);

        $this->getJson('/api/v1/public/hero', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('hero.title', 'أكاديمية النور')
            ->assertJsonPath('hero.subtitle', '');
    }

    public function test_null_subtitle_is_treated_as_a_deliberate_clear(): void
    {
        $tenant = Tenant::factory()->create(['name' => 'Geo Top']);

        TenantSetting::create([
            'tenant_id' => $tenant->id,
            'group' => 'homepage',
            'values' => [
                'hero' => [
                    'title' => 'أكاديمية النور',
                    'subtitle' => null,
                ],
            ],
        ]);

        $this->getJson('/api/v1/public/hero', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('hero.title', 'أكاديمية النور')
            ->assertJsonPath('hero.subtitle', '');
    }

    public function test_tenant_with_homepage_settings_but_no_hero_object_still_gets_defaults(): void
    {
        $tenant = Tenant::factory()->create(['name' => 'Geo Top']);

        TenantSetting::create([
            'tenant_id' => $tenant->id,
            'group' => 'homepage',
            'values' => [
                'educationalStages' => ['titleLead' => 'المستويات', 'titleEmphasis' => 'التعليمية'],
            ],
        ]);

        $this->getJson('/api/v1/public/hero', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('hero.title', 'مرحباً بكم في Geo Top')
            ->assertJsonPath('hero.subtitle', 'منصة Geo Top التعليمية — تصفّح المراحل والكورسات والمحتوى التعليمي دون تسجيل الدخول.');
    }

    /**
     * @return array<string, string>
     */
    private function tenantHeader(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
    }
}
