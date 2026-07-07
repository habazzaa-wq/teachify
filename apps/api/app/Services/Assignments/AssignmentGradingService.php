<?php

namespace App\Services\Assignments;

use App\Models\Assignment;
use App\Models\AssignmentResult;
use App\Models\AssignmentSubmission;
use App\Models\CourseEnrollment;
use App\Models\TenantUser;
use App\Services\Learning\CompletionService;
use App\Services\Notifications\NotificationEventService;
use Illuminate\Validation\ValidationException;

class AssignmentGradingService
{
    public function __construct(
        private readonly CompletionService $completions,
        private readonly NotificationEventService $notificationEvents,
    )
    {
    }

    /**
     * @param array<string, mixed> $data
     */
    public function grade(Assignment $assignment, AssignmentSubmission $submission, TenantUser $grader, array $data): AssignmentResult
    {
        $this->ensureSubmissionInAssignment($assignment, $submission);

        if (! in_array($submission->status, ['submitted', 'graded', 'returned'], true)) {
            throw ValidationException::withMessages([
                'submission' => ['Only submitted, graded, or returned submissions can be graded.'],
            ]);
        }

        if ($data['score'] > $assignment->max_score) {
            throw ValidationException::withMessages([
                'score' => ['The score may not exceed the assignment max score.'],
            ]);
        }

        $passed = (bool) ($data['passed'] ?? $data['score'] >= $assignment->max_score);

        $result = AssignmentResult::updateOrCreate(
            [
                'tenant_id' => $assignment->tenant_id,
                'assignment_id' => $assignment->id,
                'tenant_user_id' => $submission->tenant_user_id,
            ],
            [
                'score' => $data['score'],
                'passed' => $passed,
                'feedback' => $data['feedback'] ?? null,
                'graded_by_tenant_user_id' => $grader->id,
                'graded_at' => now(),
            ],
        );

        $submission->forceFill(['status' => 'graded'])->save();

        $this->synchronizeCompletion($assignment, $submission);

        $this->notificationEvents->record($assignment->course->tenant, 'assignment.graded', 'assignment-result-'.$result->id, [
            'tenant_user_id' => $submission->tenant_user_id,
            'assignment_id' => $assignment->id,
            'assignment_title' => $assignment->title,
            'score' => $result->score,
        ]);

        return $result->refresh()->load(['student.user', 'grader.user']);
    }

    public function returnSubmission(Assignment $assignment, AssignmentSubmission $submission): AssignmentSubmission
    {
        $this->ensureSubmissionInAssignment($assignment, $submission);

        $submission->forceFill(['status' => 'returned'])->save();

        return $submission->refresh();
    }

    private function ensureSubmissionInAssignment(Assignment $assignment, AssignmentSubmission $submission): void
    {
        if ($submission->tenant_id !== currentTenant()->id || $submission->assignment_id !== $assignment->id) {
            throw ValidationException::withMessages([
                'submission' => ['The selected submission is invalid for this assignment.'],
            ]);
        }
    }

    private function synchronizeCompletion(Assignment $assignment, AssignmentSubmission $submission): void
    {
        $enrollment = CourseEnrollment::query()
            ->where('course_id', $assignment->course_id)
            ->where('tenant_user_id', $submission->tenant_user_id)
            ->whereIn('status', ['active', 'completed'])
            ->first();

        if ($enrollment) {
            $this->completions->synchronize($enrollment);
        }
    }
}
