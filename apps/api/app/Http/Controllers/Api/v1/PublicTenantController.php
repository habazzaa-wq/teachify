<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\MediaAsset;
use App\Models\SeoSetting;
use App\Repositories\TenantRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicTenantController extends Controller
{
    public function __construct(
        private readonly TenantRepository $tenants,
    ) {}

    public function byDomain(Request $request): JsonResponse
    {
        $request->validate(['domain' => 'required|string|max:255']);

        $domain = $request->input('domain');
        $tenant = $this->tenants->findByDomain($domain);

        if (! $tenant) {
            return response()->json([
                'message' => 'Tenant not found for the given domain.',
            ], 404);
        }

        $domainRecord = $tenant->domains()
            ->where('domain', $domain)
            ->first();

        $branding = $this->resolveBranding($tenant);

        return response()->json([
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'domain' => $domainRecord?->domain ?? $domain,
            'status' => $tenant->status,
            'branding' => $branding,
            'platform_branding' => $this->resolvePlatformBranding($tenant),
            'seo' => $this->resolveSeo($tenant),
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate');
    }

    /**
     * Tenant-level SEO settings from the singleton `seo_settings` row.
     * The frontend merges these into its metadata (title template, description,
     * homepage title/description, organization profile, robots policy, sitemap
     * inclusion and default OG/Twitter images) so saved settings actually
     * surface in search-engine output.
     *
     * The public by-domain endpoint runs without tenant context, so the
     * tenant-scoped global scopes are bypassed and rows are filtered by the
     * resolved tenant id explicitly.
     *
     * @return array<string, mixed>|null
     */
    private function resolveSeo($tenant): ?array
    {
        $settings = SeoSetting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->first();

        if ($settings === null) {
            return null;
        }

        $ogImage = $this->assetFor($settings->default_og_image_asset_id, (int) $tenant->id);
        $twitterImage = $this->assetFor($settings->default_twitter_image_asset_id, (int) $tenant->id);

        return [
            'description' => $settings->default_description,
            'titleTemplate' => $settings->default_title_template,
            'homepageTitle' => $settings->homepage_title,
            'homepageDescription' => $settings->homepage_description,
            'organizationName' => $settings->organization_name,
            'organizationDescription' => $settings->organization_description,
            'socialProfiles' => $settings->social_profiles ?? [],
            'robotsPolicy' => $settings->default_robots_policy,
            'sitemapIncludeDefault' => (bool) $settings->sitemap_include_default,
            'ogImage' => $ogImage !== null ? $this->assetUrl($ogImage) : null,
            'twitterImage' => $twitterImage !== null ? $this->assetUrl($twitterImage) : null,
            'googleVerification' => $settings->google_verification,
            'bingVerification' => $settings->bing_verification,
        ];
    }

    /**
     * Platform-level brand colors (the "platform colors" field managed by the
     * platform admin). These are distinct from the tenant's appearance settings
     * (`branding` group) which only apply to the teacher dashboard and login.
     *
     * @return array<string, mixed>
     */
    private function resolvePlatformBranding($tenant): array
    {
        $values = $tenant->branding ?? [];

        return [
            'logo' => $values['logo'] ?? null,
            'favicon' => $values['favicon'] ?? null,
            'primaryColor' => $values['primaryColor'] ?? $values['primary_color'] ?? null,
            'secondaryColor' => $values['secondary_color'] ?? $values['secondaryColor'] ?? null,
            'accentColor' => $values['accent_color'] ?? $values['accentColor'] ?? null,
            'font' => $values['fonts'] ?? $values['font'] ?? null,
            'darkLogo' => $values['dark_logo'] ?? null,
            'lightLogo' => $values['light_logo'] ?? null,
            'logoType' => $values['logo_type'] ?? null,
            'logoIcon' => $values['logo_icon'] ?? null,
            'logoImage' => $values['logo_image'] ?? null,
        ];
    }

    private function assetFor(?int $assetId, int $tenantId): ?MediaAsset
    {
        if ($assetId === null) {
            return null;
        }

        return MediaAsset::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('id', $assetId)
            ->first();
    }

    private function assetUrl(?MediaAsset $asset): ?string
    {
        if ($asset === null) {
            return null;
        }

        return $asset->cdn_url
            ?? $asset->thumbnail_url
            ?? $asset->preview_url
            ?? $asset->poster_url;
    }

    /**
     * @return array<string, mixed>
     */
    private function resolveBranding($tenant): array
    {
        $setting = $tenant->settings()
            ->where('group', 'branding')
            ->first();

        $values = $setting?->values ?? [];

        return [
            'logo' => $values['logo'] ?? null,
            'favicon' => $values['favicon'] ?? null,
            'primaryColor' => $values['primary_color'] ?? null,
            'secondaryColor' => $values['secondary_color'] ?? null,
            'accentColor' => $values['accent_color'] ?? null,
            'font' => $values['font'] ?? null,
            'darkLogo' => $values['dark_logo'] ?? null,
            'lightLogo' => $values['light_logo'] ?? null,
            'logoType' => $values['logo_type'] ?? null,
            'logoIcon' => $values['logo_icon'] ?? null,
            'logoImage' => $values['logo_image'] ?? null,
        ];
    }
}
