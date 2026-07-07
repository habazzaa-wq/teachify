<?php

namespace App\Services\Courses;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\LessonFile;
use App\Models\LessonText;
use App\Models\LessonVideo;
use App\Models\MediaAsset;
use Illuminate\Validation\ValidationException;

class LessonContentService
{
    /**
     * @param array<string, mixed> $data
     */
    public function createVideo(Course $course, CourseSection $section, CourseLesson $lesson, array $data): LessonVideo
    {
        $this->ensureLesson($course, $section, $lesson, 'video');

        if ($lesson->video()->exists()) {
            throw ValidationException::withMessages([
                'video' => ['This lesson already has video content.'],
            ]);
        }

        $media = $this->mediaAssetForTenant($course, $data['media_asset_id'], ['video']);
        $thumbnail = isset($data['thumbnail_media_asset_id'])
            ? $this->mediaAssetForTenant($course, $data['thumbnail_media_asset_id'], ['image', 'thumbnail'])
            : null;

        return LessonVideo::create([
            'tenant_id' => $course->tenant_id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'course_lesson_id' => $lesson->id,
            'media_asset_id' => $media->id,
            'thumbnail_media_asset_id' => $thumbnail?->id,
            'processing_status' => $data['processing_status'] ?? 'pending',
            'playback_policy' => $data['playback_policy'] ?? 'private',
            'metadata' => $data['metadata'] ?? [],
        ])->refresh();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function updateVideo(Course $course, CourseSection $section, CourseLesson $lesson, LessonVideo $video, array $data): LessonVideo
    {
        $this->ensureVideo($course, $section, $lesson, $video);

        if (array_key_exists('media_asset_id', $data)) {
            $data['media_asset_id'] = $this->mediaAssetForTenant($course, $data['media_asset_id'], ['video'])->id;
        }

        if (array_key_exists('thumbnail_media_asset_id', $data)) {
            $data['thumbnail_media_asset_id'] = $data['thumbnail_media_asset_id']
                ? $this->mediaAssetForTenant($course, $data['thumbnail_media_asset_id'], ['image', 'thumbnail'])->id
                : null;
        }

        $video->fill(collect($data)->only([
            'media_asset_id',
            'thumbnail_media_asset_id',
            'processing_status',
            'playback_policy',
            'metadata',
        ])->all())->save();

        return $video->refresh();
    }

    public function deleteVideo(Course $course, CourseSection $section, CourseLesson $lesson, LessonVideo $video): void
    {
        $this->ensureVideo($course, $section, $lesson, $video);

        $video->delete();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createFile(Course $course, CourseSection $section, CourseLesson $lesson, array $data): LessonFile
    {
        $this->ensureLesson($course, $section, $lesson, 'file');
        $media = $this->mediaAssetForTenant($course, $data['media_asset_id'], ['document', 'archive', 'attachment']);

        return LessonFile::create([
            'tenant_id' => $course->tenant_id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'course_lesson_id' => $lesson->id,
            'media_asset_id' => $media->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'download_enabled' => $data['download_enabled'] ?? true,
            'sort_order' => $data['sort_order'] ?? $this->nextFileSortOrder($lesson),
        ])->refresh();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function updateFile(Course $course, CourseSection $section, CourseLesson $lesson, LessonFile $file, array $data): LessonFile
    {
        $this->ensureFile($course, $section, $lesson, $file);

        if (array_key_exists('media_asset_id', $data)) {
            $data['media_asset_id'] = $this->mediaAssetForTenant($course, $data['media_asset_id'], ['document', 'archive', 'attachment'])->id;
        }

        $file->fill(collect($data)->only([
            'media_asset_id',
            'title',
            'description',
            'download_enabled',
            'sort_order',
        ])->all())->save();

        return $file->refresh();
    }

    public function deleteFile(Course $course, CourseSection $section, CourseLesson $lesson, LessonFile $file): void
    {
        $this->ensureFile($course, $section, $lesson, $file);

        $file->delete();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createText(Course $course, CourseSection $section, CourseLesson $lesson, array $data): LessonText
    {
        $this->ensureLesson($course, $section, $lesson, 'text');

        if ($lesson->text()->exists()) {
            throw ValidationException::withMessages([
                'text' => ['This lesson already has text content.'],
            ]);
        }

        return LessonText::create([
            'tenant_id' => $course->tenant_id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'course_lesson_id' => $lesson->id,
            'body' => $data['body'],
            'format' => $data['format'],
            'metadata' => $data['metadata'] ?? [],
        ])->refresh();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function updateText(Course $course, CourseSection $section, CourseLesson $lesson, LessonText $text, array $data): LessonText
    {
        $this->ensureText($course, $section, $lesson, $text);

        $text->fill(collect($data)->only([
            'body',
            'format',
            'metadata',
        ])->all())->save();

        return $text->refresh();
    }

    public function deleteText(Course $course, CourseSection $section, CourseLesson $lesson, LessonText $text): void
    {
        $this->ensureText($course, $section, $lesson, $text);

        $text->delete();
    }

    private function ensureLesson(Course $course, CourseSection $section, CourseLesson $lesson, string $type): void
    {
        if (
            $course->tenant_id !== currentTenant()->id
            || $section->tenant_id !== $course->tenant_id
            || $section->course_id !== $course->id
            || $lesson->tenant_id !== $course->tenant_id
            || $lesson->course_id !== $course->id
            || $lesson->course_section_id !== $section->id
        ) {
            throw ValidationException::withMessages([
                'lesson' => ['The selected lesson is invalid for this hierarchy.'],
            ]);
        }

        if ($lesson->type !== $type) {
            throw ValidationException::withMessages([
                'type' => ["Lesson type [{$lesson->type}] cannot use {$type} content."],
            ]);
        }
    }

    private function ensureVideo(Course $course, CourseSection $section, CourseLesson $lesson, LessonVideo $video): void
    {
        $this->ensureLesson($course, $section, $lesson, 'video');

        if ($video->tenant_id !== $course->tenant_id || $video->course_lesson_id !== $lesson->id) {
            throw ValidationException::withMessages(['video' => ['The selected video content is invalid for this lesson.']]);
        }
    }

    private function ensureFile(Course $course, CourseSection $section, CourseLesson $lesson, LessonFile $file): void
    {
        $this->ensureLesson($course, $section, $lesson, 'file');

        if ($file->tenant_id !== $course->tenant_id || $file->course_lesson_id !== $lesson->id) {
            throw ValidationException::withMessages(['file' => ['The selected file content is invalid for this lesson.']]);
        }
    }

    private function ensureText(Course $course, CourseSection $section, CourseLesson $lesson, LessonText $text): void
    {
        $this->ensureLesson($course, $section, $lesson, 'text');

        if ($text->tenant_id !== $course->tenant_id || $text->course_lesson_id !== $lesson->id) {
            throw ValidationException::withMessages(['text' => ['The selected text content is invalid for this lesson.']]);
        }
    }

    /**
     * @param list<string> $allowedTypes
     */
    private function mediaAssetForTenant(Course $course, int $mediaAssetId, array $allowedTypes): MediaAsset
    {
        $asset = MediaAsset::query()
            ->where('tenant_id', $course->tenant_id)
            ->whereKey($mediaAssetId)
            ->first();

        if (! $asset) {
            throw ValidationException::withMessages([
                'media_asset_id' => ['The selected media asset is invalid for this tenant.'],
            ]);
        }

        if (! in_array($asset->type, $allowedTypes, true)) {
            throw ValidationException::withMessages([
                'media_asset_id' => ['The selected media asset type is invalid for this lesson content.'],
            ]);
        }

        return $asset;
    }

    private function nextFileSortOrder(CourseLesson $lesson): int
    {
        return ((int) LessonFile::query()
            ->where('course_lesson_id', $lesson->id)
            ->max('sort_order')) + 1;
    }
}
