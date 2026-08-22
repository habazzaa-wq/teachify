<?php

namespace App\Http\Controllers\Api\v1\Seo;

use App\Http\Controllers\Controller;
use App\Http\Resources\SeoSettingResource;
use App\Models\MediaAsset;
use App\Models\SeoSetting;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class SeoSettingController extends Controller
{
    public function __construct(private readonly AuditLogService $audit)
    {
    }

    public function show(): JsonResponse
    {
        Gate::authorize('seo.view');

        $settings = SeoSetting::firstOrCreate(
            ['tenant_id' => currentTenant()->id],
            ['tenant_id' => currentTenant()->id],
        );

        return response()->json([
            'data' => new SeoSettingResource($settings->load(['defaultOgImage', 'defaultTwitterImage'])),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        Gate::authorize('seo.manage_settings');

        $validated = $request->validate([
            'default_title_template' => ['nullable', 'string', 'max:255'],
            'default_description' => ['nullable', 'string', 'max:500'],
            'default_og_image_asset_id' => ['nullable', 'integer'],
            'default_twitter_image_asset_id' => ['nullable', 'integer'],
            'default_robots_policy' => ['sometimes', 'required', Rule::in(['index', 'noindex', 'index_follow', 'noindex_nofollow'])],
            'sitemap_include_default' => ['sometimes', 'boolean'],
            'organization_name' => ['nullable', 'string', 'max:255'],
            'organization_description' => ['nullable', 'string', 'max:1000'],
            'social_profiles' => ['nullable', 'array', 'max:10'],
            'social_profiles.*' => ['url', 'max:2048'],
            'homepage_title' => ['nullable', 'string', 'max:255'],
            'homepage_description' => ['nullable', 'string', 'max:500'],
            'google_verification' => ['nullable', 'string', 'max:255'],
            'bing_verification' => ['nullable', 'string', 'max:255'],
        ]);

        $this->assertMediaAsset($validated['default_og_image_asset_id'] ?? null);
        $this->assertMediaAsset($validated['default_twitter_image_asset_id'] ?? null);

        $settings = SeoSetting::firstOrCreate(
            ['tenant_id' => currentTenant()->id],
            ['tenant_id' => currentTenant()->id],
        );

        $before = $settings->toArray();
        $settings->update($validated);
        $settings->load(['defaultOgImage', 'defaultTwitterImage']);

        $this->audit->record(currentTenant(), 'seo_settings', SeoSetting::class, $settings->id,
            'settings_updated', currentTenantUser(), $before, $settings->toArray(), null, $request);

        return response()->json([
            'message' => 'تم حفظ إعدادات SEO بنجاح.',
            'data' => new SeoSettingResource($settings),
        ]);
    }

    private function assertMediaAsset(mixed $assetId): void
    {
        if ($assetId === null || $assetId === '') {
            return;
        }

        $exists = MediaAsset::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('id', (int) $assetId)
            ->exists();

        if (! $exists) {
            abort(422, 'الوسائط المحددة غير موجودة في هذه المؤسسة.');
        }
    }
}
