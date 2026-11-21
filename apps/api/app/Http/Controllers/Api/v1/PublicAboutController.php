<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
use Illuminate\Http\JsonResponse;

/**
 * Anonymous reader for the tenant's "About us" page content.
 * Serves the raw saved `about` settings group; the web app merges
 * defaults on top before rendering.
 */
class PublicAboutController extends Controller
{
    public function index(): JsonResponse
    {
        $setting = TenantSetting::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('group', 'about')
            ->first();

        return response()->json(['about' => $setting?->values ?? []]);
    }
}
