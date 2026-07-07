<?php

namespace App\Http\Controllers\Api\v1\Learning;

use App\Http\Controllers\Controller;
use App\Models\CourseEnrollment;
use App\Models\CourseLesson;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Access\AccessEvaluationService;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Learning\ProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function index(CourseEnrollment $enrollment, ProgressService $progress): JsonResponse
    {
        abort_if($enrollment->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canViewEnrollment(request()->user(), $enrollment), 403);

        return response()->json([
            'progress' => $progress->loadStudentProgress($enrollment),
        ]);
    }

    public function start(CourseLesson $lesson, ProgressService $progress, AccessEvaluationService $access): JsonResponse
    {
        $this->authorizeProgressMutation($lesson, $access);

        return response()->json([
            'message' => 'Lesson progress started.',
            'progress' => $progress->startLesson($lesson, app(TenantUser::class)),
        ], 201);
    }

    public function update(
        Request $request,
        CourseLesson $lesson,
        ProgressService $progress,
        AccessEvaluationService $access,
    ): JsonResponse {
        $this->authorizeProgressMutation($lesson, $access);

        $validated = $request->validate([
            'progress_percent' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        return response()->json([
            'message' => 'Lesson progress updated.',
            'progress' => $progress->updateLessonProgress($lesson, app(TenantUser::class), $validated['progress_percent']),
        ]);
    }

    public function complete(CourseLesson $lesson, ProgressService $progress, AccessEvaluationService $access): JsonResponse
    {
        $this->authorizeProgressMutation($lesson, $access);

        return response()->json([
            'message' => 'Lesson completed.',
            'progress' => $progress->completeLesson($lesson, app(TenantUser::class)),
        ]);
    }

    private function authorizeProgressMutation(CourseLesson $lesson, AccessEvaluationService $access): void
    {
        abort_if($lesson->tenant_id !== currentTenant()->id, 404);

        $user = request()->user();

        abort_unless(
            $this->auth()->hasRole($user, currentTenant(), 'student')
            && $this->auth()->hasPermission($user, currentTenant(), 'enrollments.view')
            && $access->canAccessLesson($user, $lesson),
            403,
        );
    }

    private function canViewEnrollment(User $user, CourseEnrollment $enrollment): bool
    {
        $tenant = currentTenant();
        $membership = app(TenantUser::class);

        if ($enrollment->tenant_user_id === $membership->id) {
            return $this->auth()->hasPermission($user, $tenant, 'enrollments.view');
        }

        if ($this->isOperator($user, $tenant)) {
            return true;
        }

        return $this->auth()->hasRole($user, $tenant, 'instructor')
            && $this->auth()->hasPermission($user, $tenant, 'enrollments.view')
            && (
                $enrollment->course->created_by_tenant_user_id === $membership->id
                || $enrollment->course->primary_instructor_tenant_user_id === $membership->id
                || $enrollment->course->instructors()->where('tenant_user_id', $membership->id)->exists()
            );
    }

    private function isOperator(User $user, Tenant $tenant): bool
    {
        return $this->auth()->hasRole($user, $tenant, 'tenant_owner')
            || $this->auth()->hasRole($user, $tenant, 'admin');
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
