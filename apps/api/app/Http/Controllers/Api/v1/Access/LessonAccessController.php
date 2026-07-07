<?php

namespace App\Http\Controllers\Api\v1\Access;

use App\Http\Controllers\Controller;
use App\Models\CourseLesson;
use App\Models\LessonAccessRule;
use App\Models\User;
use App\Services\Access\AccessEvaluationService;
use App\Services\Authorization\TenantAuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class LessonAccessController extends Controller
{
    public function show(CourseLesson $lesson, AccessEvaluationService $access): JsonResponse
    {
        abort_if($lesson->tenant_id !== currentTenant()->id, 404);
        abort_unless($access->canAccessLesson(request()->user(), $lesson), 403);

        return response()->json([
            'access' => $access->lessonRule($lesson),
        ]);
    }

    public function update(Request $request, CourseLesson $lesson): JsonResponse
    {
        abort_if($lesson->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canManageAccess(request()->user(), $lesson), 403);

        $validated = $request->validate([
            'access_mode' => ['required', Rule::in(['inherit_course', 'public_preview', 'enrolled_only', 'scheduled', 'drip'])],
            'available_from' => ['nullable', 'date'],
            'available_until' => ['nullable', 'date', 'after_or_equal:available_from'],
            'prerequisite_lesson_id' => ['nullable', 'integer'],
            'metadata' => ['sometimes', 'array'],
        ]);

        $prerequisiteId = $validated['prerequisite_lesson_id'] ?? null;

        if ($prerequisiteId) {
            $prerequisiteExists = CourseLesson::query()
                    ->where('tenant_id', currentTenant()->id)
                    ->where('course_id', $lesson->course_id)
                    ->whereKey($prerequisiteId)
                    ->exists();

            if (! $prerequisiteExists || $prerequisiteId === $lesson->id) {
                throw ValidationException::withMessages([
                    'prerequisite_lesson_id' => ['The selected prerequisite lesson is invalid for this lesson.'],
                ]);
            }
        }

        $rule = LessonAccessRule::updateOrCreate(
            [
                'tenant_id' => currentTenant()->id,
                'course_lesson_id' => $lesson->id,
            ],
            [
                'course_id' => $lesson->course_id,
                'access_mode' => $validated['access_mode'],
                'available_from' => $validated['available_from'] ?? null,
                'available_until' => $validated['available_until'] ?? null,
                'prerequisite_lesson_id' => $prerequisiteId,
                'metadata' => $validated['metadata'] ?? [],
            ],
        )->refresh();

        return response()->json([
            'message' => 'Lesson access rule updated.',
            'access' => $rule,
        ]);
    }

    public function canAccess(CourseLesson $lesson, AccessEvaluationService $access): JsonResponse
    {
        abort_if($lesson->tenant_id !== currentTenant()->id, 404);

        $evaluation = $access->evaluateLessonVisibility(request()->user(), $lesson);

        return response()->json([
            'can_access' => $evaluation->allowed,
            'can_access_media' => $access->canAccessMedia(request()->user(), $lesson),
            'reasons' => $evaluation->reasons,
            'context' => $evaluation->context,
        ]);
    }

    private function canManageAccess(User $user, CourseLesson $lesson): bool
    {
        $authorization = app(TenantAuthorizationService::class);
        $tenant = currentTenant();

        if (
            $authorization->hasRole($user, $tenant, 'tenant_owner')
            || $authorization->hasRole($user, $tenant, 'admin')
        ) {
            return $authorization->hasPermission($user, $tenant, 'courses.manage_settings');
        }

        $membership = $authorization->membershipFor($user, $tenant);

        if (! $membership || $membership->status !== 'active') {
            return false;
        }

        $course = $lesson->course;

        return $authorization->hasRole($user, $tenant, 'instructor')
            && $authorization->hasPermission($user, $tenant, 'courses.manage_settings')
            && (
                $course->created_by_tenant_user_id === $membership->id
                || $course->primary_instructor_tenant_user_id === $membership->id
                || $course->instructors()->where('tenant_user_id', $membership->id)->exists()
            );
    }
}
