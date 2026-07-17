<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
use Illuminate\Http\JsonResponse;

class PublicWhyChooseUsController extends Controller
{
    public function index(): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $setting = TenantSetting::query()
            ->where('tenant_id', $tenantId)
            ->where('group', 'homepage')
            ->first();

        $values = $setting?->values ?? [];
        $wcu = $values['whyChooseUs'] ?? [];

        $title = trim($wcu['title'] ?? '');
        $whyChooseUs = [
            'isActive' => $wcu['isActive'] ?? true,
            'title' => $title !== '' ? $title : 'لماذا تختارنا؟',
            'subtitle' => $wcu['subtitle'] ?? '',
            'features' => $wcu['features'] ?? [],
        ];

        return response()->json(['whyChooseUs' => $whyChooseUs]);
    }
}
