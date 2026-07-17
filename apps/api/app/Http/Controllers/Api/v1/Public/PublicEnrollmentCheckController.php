<?php

namespace App\Http\Controllers\Api\v1\Public;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseEnrollment;
use Illuminate\Http\JsonResponse;

class PublicEnrollmentCheckController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        $tenantId = currentTenant()->id;

        abort_if(!$tenantId, 404);

        $course = Course::query()
            ->where('tenant_id', $tenantId)
            ->where('slug', $slug)
            ->where('status', 'published')
            ->where('visibility', 'public')
            ->firstOrFail();

        $tenantUserId = currentTenantUser()?->id;

        if (!$tenantUserId) {
            return response()->json([
                'enrolled' => false,
                'enrollment' => null,
            ]);
        }

        $enrollment = CourseEnrollment::query()
            ->where('tenant_id', $tenantId)
            ->where('course_id', $course->id)
            ->where('tenant_user_id', $tenantUserId)
            ->first();

        return response()->json([
            'enrolled' => $enrollment !== null,
            'enrollment' => $enrollment,
        ]);
    }
}
