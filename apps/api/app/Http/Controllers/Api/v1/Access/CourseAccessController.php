<?php

namespace App\Http\Controllers\Api\v1\Access;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseAccessRule;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Access\AccessEvaluationService;
use App\Services\Authorization\TenantAuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseAccessController extends Controller
{
    public function show(Course $course, AccessEvaluationService $access): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        abort_unless($access->canViewCourse(request()->user(), $course), 403);

        return response()->json([
            'access' => $access->courseRule($course),
        ]);
    }

    public function update(Request $request, Course $course, AccessEvaluationService $access): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canManageAccess(request()->user(), $course), 403);

        $validated = $request->validate([
            'access_mode' => ['required', Rule::in(['private', 'enrolled_only', 'public'])],
            'requires_approval' => ['sometimes', 'boolean'],
            'allow_self_enrollment' => ['sometimes', 'boolean'],
            'invite_only' => ['sometimes', 'boolean'],
            'metadata' => ['sometimes', 'array'],
        ]);

        $rule = CourseAccessRule::updateOrCreate(
            [
                'tenant_id' => currentTenant()->id,
                'course_id' => $course->id,
            ],
            [
                'access_mode' => $validated['access_mode'],
                'requires_approval' => $validated['requires_approval'] ?? false,
                'allow_self_enrollment' => $validated['allow_self_enrollment'] ?? false,
                'invite_only' => $validated['invite_only'] ?? false,
                'metadata' => $validated['metadata'] ?? [],
            ],
        )->refresh();

        $course->forceFill(['visibility' => $rule->access_mode])->save();

        return response()->json([
            'message' => 'Course access rule updated.',
            'access' => $rule,
        ]);
    }

    public function canAccess(Course $course, AccessEvaluationService $access): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);

        $evaluation = $access->evaluateCourseVisibility(request()->user(), $course);

        return response()->json([
            'can_access' => $evaluation->allowed,
            'can_enroll' => $access->canEnroll(request()->user(), $course),
            'reasons' => $evaluation->reasons,
            'context' => $evaluation->context,
        ]);
    }

    private function canManageAccess(User $user, Course $course): bool
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

        return $authorization->hasRole($user, $tenant, 'instructor')
            && $authorization->hasPermission($user, $tenant, 'courses.manage_settings')
            && (
                $course->created_by_tenant_user_id === $membership->id
                || $course->primary_instructor_tenant_user_id === $membership->id
                || $course->instructors()->where('tenant_user_id', $membership->id)->exists()
            );
    }
}
