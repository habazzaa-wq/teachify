<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\CourseEnrollment;
use Illuminate\Http\JsonResponse;

/**
 * Read-only self-service list of the current learner's enrolled courses. Returns
 * a minimal identity payload (course id + slug) used to annotate public course
 * cards/CTAs with the student's real enrollment state, so an already-subscribed
 * course no longer renders a "subscribe now" action.
 */
class StudentCourseController extends Controller
{
    public function index(): JsonResponse
    {
        $membership = currentTenantUser();

        abort_if(! $membership || $membership->tenant_id !== currentTenant()->id, 404);

        $courses = CourseEnrollment::query()
            ->with('course:id,tenant_id,slug')
            ->where('tenant_user_id', $membership->id)
            ->whereHas('course', function ($query): void {
                $query->where('tenant_id', currentTenant()->id)
                    ->where('status', 'published')
                    ->where('visibility', 'public');
            })
            ->get()
            ->map(fn (CourseEnrollment $enrollment): array => [
                'id' => (string) $enrollment->course_id,
                'slug' => $enrollment->course?->slug,
            ])
            ->filter(fn (array $item): bool => $item['slug'] !== null)
            ->values()
            ->all();

        return response()->json([
            'data' => $courses,
        ]);
    }
}