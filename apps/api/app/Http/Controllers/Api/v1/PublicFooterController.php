<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
use Illuminate\Http\JsonResponse;

/**
 * Anonymous reader for the tenant's footer content (contact details, social
 * links, quick-link groups, about text). Serves the raw saved `footer` settings
 * group; the web app merges defaults on top.
 */
class PublicFooterController extends Controller
{
    public function index(): JsonResponse
    {
        $setting = TenantSetting::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('group', 'footer')
            ->first();

        return response()->json(['footer' => $setting?->values ?? []]);
    }
}