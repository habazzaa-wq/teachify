<?php

namespace App\Http\Controllers\Api\v1\Assignments;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\TenantUser;
use App\Services\Access\AccessEvaluationService;
use App\Services\Assignments\AssignmentSubmissionService;
use App\Services\Authorization\TenantAuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssignmentSubmissionController extends Controller
{
    public function store(Request $request, Assignment $assignment, AssignmentSubmissionService $submissions, AccessEvaluationService $access): JsonResponse
    {
        abort_if($assignment->tenant_id !== currentTenant()->id, 404);
        $this->authorizeStudentAssignmentAccess($assignment, $access);

        $validated = $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        $submission = $submissions->createSubmission($assignment, app(TenantUser::class), $validated);

        return response()->json([
            'message' => 'Assignment submission created.',
            'submission' => $submission,
        ], 201);
    }

    public function attachFile(
        Request $request,
        Assignment $assignment,
        AssignmentSubmission $submission,
        AssignmentSubmissionService $submissions,
        AccessEvaluationService $access,
    ): JsonResponse {
        abort_if($assignment->tenant_id !== currentTenant()->id, 404);
        abort_if($submission->tenant_id !== currentTenant()->id || $submission->assignment_id !== $assignment->id, 404);
        $this->authorizeStudentAssignmentAccess($assignment, $access);

        $validated = $request->validate([
            'media_asset_id' => ['required', 'integer'],
            'title' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $file = $submissions->attachFile($assignment, $submission, app(TenantUser::class), $validated);

        return response()->json([
            'message' => 'Assignment submission file attached.',
            'file' => $file,
        ], 201);
    }

    public function submit(
        Assignment $assignment,
        AssignmentSubmission $submission,
        AssignmentSubmissionService $submissions,
        AccessEvaluationService $access,
    ): JsonResponse {
        abort_if($assignment->tenant_id !== currentTenant()->id, 404);
        abort_if($submission->tenant_id !== currentTenant()->id || $submission->assignment_id !== $assignment->id, 404);
        $this->authorizeStudentAssignmentAccess($assignment, $access);

        $submission = $submissions->submit($assignment, $submission, app(TenantUser::class));

        return response()->json([
            'message' => 'Assignment submitted.',
            'submission' => $submission,
        ]);
    }

    private function authorizeStudentAssignmentAccess(Assignment $assignment, AccessEvaluationService $access): void
    {
        $user = request()->user();
        $authorization = app(TenantAuthorizationService::class);

        abort_unless(
            $authorization->hasRole($user, currentTenant(), 'student')
            && $assignment->status === 'published'
            && $access->canAccessLesson($user, $assignment->lesson),
            403,
        );
    }
}
