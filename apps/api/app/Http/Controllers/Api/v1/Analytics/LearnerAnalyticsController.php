<?php

namespace App\Http\Controllers\Api\v1\Analytics;

use App\Http\Controllers\Controller;
use App\Models\TenantUser;
use App\Services\Analytics\AnalyticsQueryService;
use Illuminate\Http\JsonResponse;

class LearnerAnalyticsController extends Controller
{
    public function show(TenantUser $membership, AnalyticsQueryService $analytics): JsonResponse
    {
        abort_if($membership->tenant_id !== currentTenant()->id, 404);

        return response()->json([
            'analytics' => $analytics->learner(currentTenant(), app(TenantUser::class), $membership),
        ]);
    }
}
