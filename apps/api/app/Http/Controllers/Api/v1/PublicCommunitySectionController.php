<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
use Illuminate\Http\JsonResponse;

/**
 * Public endpoint for the homepage "منتدى الطلاب" section.
 *
 * Returns the teacher-configured design + dynamic content stored under
 * the "homepage" settings group (values.community), merged over defaults.
 */
class PublicCommunitySectionController extends Controller
{
    public function index(): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $setting = TenantSetting::query()
            ->where('tenant_id', $tenantId)
            ->where('group', 'homepage')
            ->first();

        $values = $setting?->values ?? [];
        $community = $values['community'] ?? null;

        return response()->json([
            'community' => $community,
            'isActive' => is_array($community)
                ? ($community['isActive'] ?? true)
                : false,
        ]);
    }
}
