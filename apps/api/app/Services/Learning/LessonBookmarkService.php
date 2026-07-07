<?php

namespace App\Services\Learning;

use App\Models\CourseLesson;
use App\Models\LessonBookmark;
use App\Models\MediaAsset;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Access\AccessEvaluationService;
use App\Services\Authorization\TenantAuthorizationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class LessonBookmarkService
{
    public function __construct(
        private readonly AccessEvaluationService $access,
        private readonly TenantAuthorizationService $authorization,
    ) {
    }

    /**
     * @return Collection<int, LessonBookmark>
     */
    public function list(Tenant $tenant, TenantUser $student, CourseLesson $lesson): Collection
    {
        $this->authorizeStudentAccess($tenant, $student, $lesson);

        return LessonBookmark::query()
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
    public function create(Tenant $tenant, TenantUser $student, CourseLesson $lesson, array $data): LessonBookmark
    {
        $this->authorizeStudentAccess($tenant, $student, $lesson);
        $this->validateMediaAsset($tenant, $data['media_asset_id'] ?? null);

        return LessonBookmark::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $student->id,
            'course_id' => $lesson->course_id,
            'course_section_id' => $lesson->course_section_id,
            'course_lesson_id' => $lesson->id,
            'media_asset_id' => $data['media_asset_id'] ?? null,
            'timestamp_seconds' => $data['timestamp_seconds'] ?? null,
            'label' => $data['label'] ?? null,
        ])->refresh();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(Tenant $tenant, TenantUser $student, CourseLesson $lesson, LessonBookmark $bookmark, array $data): LessonBookmark
    {
        $this->authorizeStudentAccess($tenant, $student, $lesson);
        $this->ensureOwnedBookmark($tenant, $student, $lesson, $bookmark);
        $this->validateMediaAsset($tenant, $data['media_asset_id'] ?? $bookmark->media_asset_id);

        $bookmark->forceFill([
            'media_asset_id' => array_key_exists('media_asset_id', $data) ? $data['media_asset_id'] : $bookmark->media_asset_id,
            'timestamp_seconds' => array_key_exists('timestamp_seconds', $data) ? $data['timestamp_seconds'] : $bookmark->timestamp_seconds,
            'label' => array_key_exists('label', $data) ? $data['label'] : $bookmark->label,
        ])->save();

        return $bookmark->refresh();
    }

    public function delete(Tenant $tenant, TenantUser $student, CourseLesson $lesson, LessonBookmark $bookmark): void
    {
        $this->authorizeStudentAccess($tenant, $student, $lesson);
        $this->ensureOwnedBookmark($tenant, $student, $lesson, $bookmark);

        $bookmark->delete();
    }

    private function authorizeStudentAccess(Tenant $tenant, TenantUser $student, CourseLesson $lesson): void
    {
        if ($student->tenant_id !== $tenant->id || $lesson->tenant_id !== $tenant->id) {
            throw new AuthorizationException('This lesson is not available.');
        }

        if (! $this->authorization->hasRole($student->user, $tenant, 'student')) {
            throw new AuthorizationException('Only students can manage lesson bookmarks.');
        }

        if (! $this->access->canAccessLesson($student->user, $lesson)) {
            throw new AuthorizationException('This lesson is not available.');
        }
    }

    private function ensureOwnedBookmark(Tenant $tenant, TenantUser $student, CourseLesson $lesson, LessonBookmark $bookmark): void
    {
        if ($bookmark->tenant_id !== $tenant->id || $bookmark->tenant_user_id !== $student->id || $bookmark->course_lesson_id !== $lesson->id) {
            throw ValidationException::withMessages([
                'bookmark' => ['The lesson bookmark is invalid.'],
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
