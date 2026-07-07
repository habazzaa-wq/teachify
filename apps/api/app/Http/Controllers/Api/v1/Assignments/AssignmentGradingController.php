<?php

namespace App\Http\Controllers\Api\v1\Assignments;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Assignments\AssignmentGradingService;
use App\Services\Authorization\TenantAuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssignmentGradingController extends Controller
{
    public function grade(Request $request, Assignment $assignment, AssignmentSubmission $submission, AssignmentGradingService $grading): JsonResponse
    {
        abort_if($assignment->tenant_id !== currentTenant()->id, 404);
        abort_if($submission->tenant_id !== currentTenant()->id || $submission->assignment_id !== $assignment->id, 404);
        abort_unless($this->canGradeAssignment(request()->user(), $assignment->course), 403);

        $validated = $request->validate([
            'score' => ['required', 'integer', 'min:0'],
            'passed' => ['sometimes', 'boolean'],
            'feedback' => ['nullable', 'string'],
            'return_submission' => ['sometimes', 'boolean'],
        ]);

        if ($validated['return_submission'] ?? false) {
            $submission = $grading->returnSubmission($assignment, $submission);

            return response()->json([
                'message' => 'Assignment submission returned.',
                'submission' => $submission,
            ]);
        }

        $result = $grading->grade($assignment, $submission, app(TenantUser::class), $validated);

        return response()->json([
            'message' => 'Assignment submission graded.',
            'result' => $result,
        ]);
    }

    private function canGradeAssignment(User $user, Course $course): bool
    {
        $authorization = app(TenantAuthorizationService::class);
        $tenant = currentTenant();

        if ($authorization->hasRole($user, $tenant, 'tenant_owner') || $authorization->hasRole($user, $tenant, 'admin')) {
            return $authorization->hasPermission($user, $tenant, 'courses.update');
        }

        $membership = $authorization->membershipFor($user, $tenant);

        if (! $membership || $membership->status !== 'active') {
            return false;
        }

        return $authorization->hasRole($user, $tenant, 'instructor')
            && $authorization->hasPermission($user, $tenant, 'courses.update')
            && (
                $course->created_by_tenant_user_id === $membership->id
                || $course->primary_instructor_tenant_user_id === $membership->id
                || $course->instructors()->where('tenant_user_id', $membership->id)->exists()
            );
    }
}
