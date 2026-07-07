<?php

namespace App\Services\Courses;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Repositories\CourseLessonRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CourseLessonService
{
    public function __construct(
        private readonly CourseLessonRepository $repository,
    ) {}

    public function list(Course $course, ?CourseSection $section = null, array $params = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return $this->repository->list($params, $course, $section);
    }

    public function get(Course $course, CourseSection $section, int $id): CourseLesson
    {
        return $this->repository->findByIdOrFail($id, $course, $section);
    }

    public function create(Course $course, CourseSection $section, array $data): CourseLesson
    {
        $this->ensureSectionBelongsToCourse($course, $section);

        return DB::transaction(function () use ($course, $section, $data): CourseLesson {
            return $this->repository->create([
                'tenant_id' => $course->tenant_id,
                'course_id' => $course->id,
                'course_section_id' => $section->id,
                'title' => $data['title'],
                'slug' => $this->uniqueLessonSlug($course, $section, $data['slug'] ?? $data['title']),
                'short_description' => $data['short_description'] ?? null,
                'description' => $data['description'] ?? null,
                'type' => $data['lesson_type'] ?? $data['type'] ?? 'video',
                'lesson_type' => $data['lesson_type'] ?? $data['type'] ?? 'video',
                'status' => $data['status'] ?? 'draft',
                'visibility' => $data['visibility'] ?? 'private',
                'sort_order' => $data['sort_order'] ?? $this->nextSortOrder($section),
                'duration_seconds' => $data['duration_seconds'] ?? null,
                'estimated_duration' => $data['estimated_duration'] ?? null,
                'free_preview' => $data['free_preview'] ?? false,
                'downloadable' => $data['downloadable'] ?? false,
                'featured' => $data['featured'] ?? false,
                'comments_enabled' => $data['comments_enabled'] ?? true,
                'notes' => $data['notes'] ?? null,
                'color' => $data['color'] ?? null,
                'icon' => $data['icon'] ?? null,
                'published_at' => ($data['status'] ?? 'draft') === 'published' ? now() : null,
            ]);
        });
    }

    public function update(Course $course, CourseSection $section, CourseLesson $lesson, array $data): CourseLesson
    {
        $this->ensureLessonBelongsToSection($course, $section, $lesson);

        return DB::transaction(function () use ($course, $section, $lesson, $data): CourseLesson {
            $updateData = collect($data)->only([
                'title', 'short_description', 'description', 'status', 'visibility',
                'sort_order', 'duration_seconds', 'estimated_duration',
                'free_preview', 'downloadable', 'featured', 'comments_enabled',
                'notes', 'color', 'icon',
            ])->all();

            if (array_key_exists('slug', $data)) {
                $updateData['slug'] = $this->uniqueLessonSlug($course, $section, $data['slug'], $lesson);
            } elseif (array_key_exists('title', $data) && ! array_key_exists('slug', $data)) {
                $updateData['slug'] = $this->uniqueLessonSlug($course, $section, $data['title'], $lesson);
            }

            if (array_key_exists('lesson_type', $data)) {
                $updateData['lesson_type'] = $data['lesson_type'];
                $updateData['type'] = $data['lesson_type'];
            } elseif (array_key_exists('type', $data)) {
                $updateData['type'] = $data['type'];
                $updateData['lesson_type'] = $data['type'];
            }

            if ($data['status'] ?? null === 'published' && $lesson->status !== 'published') {
                $updateData['published_at'] = now();
            }

            return $this->repository->update($lesson, $updateData);
        });
    }

    public function delete(Course $course, CourseSection $section, CourseLesson $lesson): void
    {
        $this->ensureLessonBelongsToSection($course, $section, $lesson);
        $this->repository->delete($lesson);
    }

    public function restore(Course $course, CourseSection $section, int $id): ?CourseLesson
    {
        return $this->repository->restore($id, $course, $section);
    }

    public function duplicate(Course $course, CourseSection $section, CourseLesson $lesson): CourseLesson
    {
        return DB::transaction(function () use ($course, $section, $lesson): CourseLesson {
            $this->ensureLessonBelongsToSection($course, $section, $lesson);

            return $this->repository->create([
                'tenant_id' => $course->tenant_id,
                'course_id' => $course->id,
                'course_section_id' => $section->id,
                'title' => $lesson->title . ' (نسخة)',
                'slug' => $this->uniqueLessonSlug($course, $section, $lesson->slug . '-copy'),
                'short_description' => $lesson->short_description,
                'description' => $lesson->description,
                'type' => $lesson->type,
                'lesson_type' => $lesson->lesson_type ?? $lesson->type,
                'status' => 'draft',
                'visibility' => $lesson->visibility,
                'sort_order' => $this->nextSortOrder($section),
                'duration_seconds' => $lesson->duration_seconds,
                'estimated_duration' => $lesson->estimated_duration,
                'free_preview' => false,
                'downloadable' => $lesson->downloadable,
                'featured' => false,
                'comments_enabled' => $lesson->comments_enabled,
                'notes' => $lesson->notes,
                'color' => $lesson->color,
                'icon' => $lesson->icon,
            ]);
        });
    }

    public function changeStatus(Course $course, CourseSection $section, CourseLesson $lesson, string $status): CourseLesson
    {
        $this->ensureLessonBelongsToSection($course, $section, $lesson);

        $allowed = [
            'draft' => ['review', 'published', 'archived'],
            'review' => ['draft', 'published', 'archived'],
            'published' => ['draft', 'review', 'archived'],
            'scheduled' => ['draft', 'published', 'archived'],
            'archived' => ['draft', 'published'],
        ];

        if (! in_array($status, $allowed[$lesson->status] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition lesson from {$lesson->status} to {$status}."],
            ]);
        }

        $updateData = ['status' => $status];

        if ($status === 'published' && $lesson->status !== 'published') {
            $updateData['published_at'] = now();
        }

        return $this->repository->update($lesson, $updateData);
    }

    public function publish(Course $course, CourseSection $section, CourseLesson $lesson): CourseLesson
    {
        return $this->changeStatus($course, $section, $lesson, 'published');
    }

    public function archive(Course $course, CourseSection $section, CourseLesson $lesson): CourseLesson
    {
        return $this->changeStatus($course, $section, $lesson, 'archived');
    }

    public function toggleFeatured(Course $course, CourseSection $section, CourseLesson $lesson): CourseLesson
    {
        $this->ensureLessonBelongsToSection($course, $section, $lesson);

        return $this->repository->update($lesson, [
            'featured' => ! $lesson->featured,
        ]);
    }

    public function toggleFreePreview(Course $course, CourseSection $section, CourseLesson $lesson): CourseLesson
    {
        $this->ensureLessonBelongsToSection($course, $section, $lesson);

        return $this->repository->update($lesson, [
            'free_preview' => ! $lesson->free_preview,
        ]);
    }

    public function reorder(Course $course, CourseSection $section, array $lessons): void
    {
        $this->ensureSectionBelongsToCourse($course, $section);

        DB::transaction(function () use ($section, $lessons): void {
            $ids = collect($lessons)->pluck('id')->unique()->values();

            if ($ids->count() !== count($lessons)) {
                throw ValidationException::withMessages([
                    'lessons' => ['Duplicate lesson ids are not allowed.'],
                ]);
            }

            $existing = CourseLesson::query()
                ->where('course_section_id', $section->id)
                ->whereIn('id', $ids->all())
                ->pluck('id');

            if ($existing->count() !== $ids->count()) {
                throw ValidationException::withMessages([
                    'lessons' => ['One or more lessons are invalid for this section.'],
                ]);
            }

            foreach ($lessons as $lesson) {
                CourseLesson::query()
                    ->where('course_section_id', $section->id)
                    ->whereKey($lesson['id'])
                    ->update(['sort_order' => $lesson['sort_order']]);
            }
        });
    }

    public function move(
        Course $course,
        CourseSection $section,
        CourseLesson $lesson,
        int $targetSectionId,
        ?int $sortOrder = null,
    ): CourseLesson {
        $this->ensureLessonBelongsToSection($course, $section, $lesson);

        $targetSection = CourseSection::query()
            ->where('course_id', $course->id)
            ->whereKey($targetSectionId)
            ->first();

        if (! $targetSection) {
            throw ValidationException::withMessages([
                'course_section_id' => ['The selected target section is invalid for this course.'],
            ]);
        }

        return $this->repository->update($lesson, [
            'course_section_id' => $targetSection->id,
            'sort_order' => $sortOrder ?? $this->nextSortOrder($targetSection),
        ]);
    }

    public function getMetrics(?Course $course = null, ?CourseSection $section = null): array
    {
        return [
            'totalLessons' => $this->repository->countTotal($course, $section),
            'published' => $this->repository->countByStatus('published', $course, $section),
            'draft' => $this->repository->countByStatus('draft', $course, $section),
            'archived' => $this->repository->countByStatus('archived', $course, $section),
            'freePreview' => $this->repository->countFreePreview($course, $section),
            'featured' => $this->repository->countFeatured($course, $section),
            'avgDuration' => $this->repository->avgDuration($course, $section),
        ];
    }

    public function exportCsv(Course $course, ?CourseSection $section = null): StreamedResponse
    {
        $lessons = $this->repository->listAll([], $course, $section);

        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="lessons_' . now()->format('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($lessons): void {
            $handle = fopen('php://output', 'wb');
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Title', 'Slug', 'Type', 'Status', 'Visibility', 'Order',
                'Duration (sec)', 'Est. Duration (min)', 'Free Preview',
                'Downloadable', 'Featured', 'Comments', 'Course', 'Section',
                'Created At',
            ]);

            foreach ($lessons as $lesson) {
                fputcsv($handle, [
                    $lesson->title,
                    $lesson->slug,
                    $lesson->lesson_type ?? $lesson->type,
                    $lesson->status,
                    $lesson->visibility,
                    $lesson->sort_order,
                    $lesson->duration_seconds,
                    $lesson->estimated_duration,
                    $lesson->free_preview ? 'Yes' : 'No',
                    $lesson->downloadable ? 'Yes' : 'No',
                    $lesson->featured ? 'Yes' : 'No',
                    $lesson->comments_enabled ? 'Yes' : 'No',
                    $lesson->course?->title,
                    $lesson->section?->title,
                    $lesson->created_at->toIso8601String(),
                ]);
            }

            fclose($handle);
        };

        return new StreamedResponse($callback, 200, $headers);
    }

    public function nextSortOrder(CourseSection $section): int
    {
        return ((int) CourseLesson::query()
            ->where('course_section_id', $section->id)
            ->max('sort_order')) + 1;
    }

    private function uniqueLessonSlug(Course $course, CourseSection $section, string $value, ?CourseLesson $ignore = null): string
    {
        $slug = Str::slug($value);

        if ($slug === '') {
            throw ValidationException::withMessages([
                'slug' => ['The lesson slug is invalid.'],
            ]);
        }

        $query = CourseLesson::query()
            ->where('course_id', $course->id)
            ->where('course_section_id', $section->id)
            ->where('slug', $slug);

        if ($ignore) {
            $query->whereKeyNot($ignore->id);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'slug' => ['The lesson slug has already been taken in this section.'],
            ]);
        }

        return $slug;
    }

    private function ensureSectionBelongsToCourse(Course $course, CourseSection $section): void
    {
        if ($section->tenant_id !== $course->tenant_id || $section->course_id !== $course->id) {
            throw ValidationException::withMessages([
                'section' => ['The selected section is invalid for this course.'],
            ]);
        }
    }

    private function ensureLessonBelongsToSection(Course $course, CourseSection $section, CourseLesson $lesson): void
    {
        $this->ensureSectionBelongsToCourse($course, $section);

        if (
            $lesson->tenant_id !== $course->tenant_id
            || $lesson->course_id !== $course->id
            || $lesson->course_section_id !== $section->id
        ) {
            throw ValidationException::withMessages([
                'lesson' => ['The selected lesson is invalid for this section.'],
            ]);
        }
    }
}
