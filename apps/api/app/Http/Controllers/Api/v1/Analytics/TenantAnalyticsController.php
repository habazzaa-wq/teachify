<?php

namespace App\Http\Controllers\Api\v1\Analytics;

use App\Http\Controllers\Controller;
use App\Models\TenantUser;
use App\Services\Analytics\AnalyticsQueryService;
use Illuminate\Http\JsonResponse;

class TenantAnalyticsController extends Controller
{
    public function overview(AnalyticsQueryService $analytics): JsonResponse
    {
        return response()->json([
            'overview' => $analytics->tenantOverview(currentTenant(), app(TenantUser::class)),
        ]);
    }

    public function courses(AnalyticsQueryService $analytics): JsonResponse
    {
        return response()->json([
            'courses' => $analytics->courses(currentTenant(), app(TenantUser::class)),
        ]);
    }

    public function learners(AnalyticsQueryService $analytics): JsonResponse
    {
        return response()->json([
            'learners' => $analytics->learners(currentTenant(), app(TenantUser::class)),
        ]);
    }
}
