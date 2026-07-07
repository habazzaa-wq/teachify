<?php

namespace App\Services\Assignments;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\AssignmentSubmissionFile;
use App\Models\MediaAsset;
use App\Models\TenantUser;
use App\Services\Notifications\NotificationEventService;
use Illuminate\Validation\ValidationException;

class AssignmentSubmissionService
{
    public function __construct(private readonly NotificationEventService $notificationEvents)
    {
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createSubmission(Assignment $assignment, TenantUser $student, array $data = []): AssignmentSubmission
    {
        $this->ensureStudentCanSubmit($assignment, $student);

        return AssignmentSubmission::firstOrCreate(
            [
                'tenant_id' => $assignment->tenant_id,
                'assignment_id' => $assignment->id,
                'tenant_user_id' => $student->id,
            ],
            [
                'status' => 'draft',
                'notes' => $data['notes'] ?? null,
                'submitted_at' => null,
            ],
        )->refresh()->load('files.mediaAsset');
    }

    /**
     * @param array<string, mixed> $data
     */
    public function attachFile(Assignment $assignment, AssignmentSubmission $submission, TenantUser $student, array $data): AssignmentSubmissionFile
    {
        $this->ensureSubmissionOwnedByStudent($assignment, $submission, $student);

        if (! in_array($submission->status, ['draft', 'returned'], true)) {
            throw ValidationException::withMessages([
                'submission' => ['Files can only be attached to draft or returned submissions.'],
            ]);
        }

        $asset = MediaAsset::query()
            ->where('tenant_id', currentTenant()->id)
            ->whereKey($data['media_asset_id'])
            ->first();

        if (! $asset) {
            throw ValidationException::withMessages([
                'media_asset_id' => ['The selected media asset is invalid for this tenant.'],
            ]);
        }

        return AssignmentSubmissionFile::updateOrCreate(
            [
                'tenant_id' => currentTenant()->id,
                'assignment_submission_id' => $submission->id,
                'media_asset_id' => $asset->id,
            ],
            [
                'title' => $data['title'] ?? $asset->original_filename ?? 'Submission file',
                'sort_order' => $data['sort_order'] ?? 0,
            ],
        )->refresh()->load('mediaAsset');
    }

    public function submit(Assignment $assignment, AssignmentSubmission $submission, TenantUser $student): AssignmentSubmission
    {
        $this->ensureSubmissionOwnedByStudent($assignment, $submission, $student);

        if (! in_array($submission->status, ['draft', 'returned'], true)) {
            throw ValidationException::withMessages([
                'submission' => ['Only draft or returned submissions can be submitted.'],
            ]);
        }

        if ($assignment->due_at && now()->gt($assignment->due_at) && ! $assignment->allow_late_submission) {
            throw ValidationException::withMessages([
                'submission' => ['This assignment no longer accepts submissions.'],
            ]);
        }

        $submission->forceFill([
            'status' => 'submitted',
            'submitted_at' => now(),
        ])->save();

        $submission = $submission->refresh()->load('files.mediaAsset');

        $this->notificationEvents->record($assignment->course->tenant, 'assignment.submitted', 'assignment-submission-'.$submission->id, [
            'tenant_user_id' => $submission->tenant_user_id,
            'assignment_id' => $assignment->id,
            'assignment_title' => $assignment->title,
        ]);

        return $submission;
    }

    private function ensureStudentCanSubmit(Assignment $assignment, TenantUser $student): void
    {
        if ($assignment->tenant_id !== currentTenant()->id || $student->tenant_id !== currentTenant()->id) {
            throw ValidationException::withMessages([
                'assignment' => ['The selected assignment is invalid for this tenant.'],
            ]);
        }

        if ($assignment->status !== 'published') {
            throw ValidationException::withMessages([
                'assignment' => ['The selected assignment is not available.'],
            ]);
        }
    }

    private function ensureSubmissionOwnedByStudent(Assignment $assignment, AssignmentSubmission $submission, TenantUser $student): void
    {
        if (
            $submission->tenant_id !== currentTenant()->id
            || $submission->assignment_id !== $assignment->id
            || $submission->tenant_user_id !== $student->id
        ) {
            throw ValidationException::withMessages([
                'submission' => ['The selected submission is invalid for this assignment.'],
            ]);
        }
    }
}
