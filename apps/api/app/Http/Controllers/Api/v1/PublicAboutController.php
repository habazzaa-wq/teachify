<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
use Illuminate\Http\JsonResponse;

class PublicAboutController extends Controller
{
    public function index(): JsonResponse
    {
        $setting = TenantSetting::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('group', 'about')
            ->first();

        $values = $setting?->values ?? [];

        return response()->json([
            'about' => ($values['enabled'] ?? false) === true ? $values : null,
        ]);
    }
}
