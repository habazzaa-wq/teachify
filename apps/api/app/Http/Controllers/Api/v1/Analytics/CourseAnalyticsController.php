<?php

namespace App\Http\Controllers\Api\v1\Analytics;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\TenantUser;
use App\Services\Analytics\AnalyticsQueryService;
use Illuminate\Http\JsonResponse;

class CourseAnalyticsController extends Controller
{
    public function show(Course $course, AnalyticsQueryService $analytics): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);

        return response()->json([
            'analytics' => $analytics->course(currentTenant(), app(TenantUser::class), $course),
        ]);
    }
}
