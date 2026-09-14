<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
use Illuminate\Http\JsonResponse;

/**
 * Anonymous reader for the tenant's legal documents (privacy policy + terms).
 * Serves the raw saved `legal` settings group; the web app's merge layer fills
 * rich Arabic defaults on top, so the public pages never render empty.
 */
class PublicLegalController extends Controller
{
    public function index(): JsonResponse
    {
        $setting = TenantSetting::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('group', 'legal')
            ->first();

        return response()->json(['legal' => $setting?->values ?? []]);
    }
}