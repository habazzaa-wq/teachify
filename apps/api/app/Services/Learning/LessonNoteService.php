<?php

namespace App\Services\Learning;

use App\Models\CourseLesson;
use App\Models\LessonNote;
use App\Models\MediaAsset;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Access\AccessEvaluationService;
use App\Services\Authorization\TenantAuthorizationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class LessonNoteService
{
    public function __construct(
        private readonly AccessEvaluationService $access,
        private readonly TenantAuthorizationService $authorization,
    ) {
    }

    /**
     * @return Collection<int, LessonNote>
     */
    public function list(Tenant $tenant, TenantUser $student, CourseLesson $lesson): Collection
    {
        $this->authorizeStudentAccess($tenant, $student, $lesson);

        return LessonNote::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $student->id)
            ->where('course_lesson_id', $lesson->id)
            ->orderBy('timestamp_seconds')
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(Tenant $tenant, TenantUser $student, CourseLesson $lesson, array $data): LessonNote
    {
        $this->authorizeStudentAccess($tenant, $student, $lesson);
        $this->validateMediaAsset($tenant, $data['media_asset_id'] ?? null);

        return LessonNote::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $student->id,
            'course_id' => $lesson->course_id,
            'course_section_id' => $lesson->course_section_id,
            'course_lesson_id' => $lesson->id,
            'media_asset_id' => $data['media_asset_id'] ?? null,
            'timestamp_seconds' => $data['timestamp_seconds'] ?? null,
            'title' => $data['title'] ?? null,
            'body' => $data['body'],
        ])->refresh();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(Tenant $tenant, TenantUser $student, CourseLesson $lesson, LessonNote $note, array $data): LessonNote
    {
        $this->authorizeStudentAccess($tenant, $student, $lesson);
        $this->ensureOwnedNote($tenant, $student, $lesson, $note);
        $this->validateMediaAsset($tenant, $data['media_asset_id'] ?? $note->media_asset_id);

        $note->forceFill([
            'media_asset_id' => array_key_exists('media_asset_id', $data) ? $data['media_asset_id'] : $note->media_asset_id,
            'timestamp_seconds' => array_key_exists('timestamp_seconds', $data) ? $data['timestamp_seconds'] : $note->timestamp_seconds,
            'title' => array_key_exists('title', $data) ? $data['title'] : $note->title,
            'body' => $data['body'] ?? $note->body,
        ])->save();

        return $note->refresh();
    }

    public function delete(Tenant $tenant, TenantUser $student, CourseLesson $lesson, LessonNote $note): void
    {
        $this->authorizeStudentAccess($tenant, $student, $lesson);
        $this->ensureOwnedNote($tenant, $student, $lesson, $note);

        $note->delete();
    }

    private function authorizeStudentAccess(Tenant $tenant, TenantUser $student, CourseLesson $lesson): void
    {
        if ($student->tenant_id !== $tenant->id || $lesson->tenant_id !== $tenant->id) {
            throw new AuthorizationException('This lesson is not available.');
        }

        if (! $this->authorization->hasRole($student->user, $tenant, 'student')) {
            throw new AuthorizationException('Only students can manage lesson notes.');
        }

        if (! $this->access->canAccessLesson($student->user, $lesson)) {
            throw new AuthorizationException('This lesson is not available.');
        }
    }

    private function ensureOwnedNote(Tenant $tenant, TenantUser $student, CourseLesson $lesson, LessonNote $note): void
    {
        if ($note->tenant_id !== $tenant->id || $note->tenant_user_id !== $student->id || $note->course_lesson_id !== $lesson->id) {
            throw ValidationException::withMessages([
                'note' => ['The lesson note is invalid.'],
            ]);
        }
    }

    private function validateMediaAsset(Tenant $tenant, mixed $mediaAssetId): void
    {
        if ($mediaAssetId === null) {
            return;
        }

        $exists = MediaAsset::query()
            ->where('tenant_id', $tenant->id)
            ->whereKey($mediaAssetId)
            ->exists();

        if (! $exists) {
            throw ValidationException::withMessages([
                'media_asset_id' => ['The selected media asset is invalid for this tenant.'],
            ]);
        }
    }
}
