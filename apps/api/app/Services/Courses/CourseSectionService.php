<?php

namespace App\Services\Courses;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Repositories\CourseSectionRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CourseSectionService
{
    public function __construct(
        private readonly CourseSectionRepository $repository,
    ) {}

    public function list(Course $course, array $params = [], bool $withTrashed = false): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return $this->repository->list($params, $course, $withTrashed);
    }

    public function get(Course $course, int $id): CourseSection
    {
        return $this->repository->findByIdOrFail($id, $course);
    }

    public function create(Course $course, array $data): CourseSection
    {
        return DB::transaction(function () use ($course, $data): CourseSection {
            $section = $this->repository->create([
                'tenant_id' => $course->tenant_id,
                'course_id' => $course->id,
                'course_module_id' => $data['course_module_id'] ?? null,
                'title' => $data['title'],
                'slug' => $this->uniqueSectionSlug($course, $data['slug'] ?? $data['title']),
                'description' => $data['description'] ?? null,
                'sort_order' => $data['sort_order'] ?? $this->nextSortOrder($course),
                'duration_minutes' => $data['duration_minutes'] ?? null,
                'free_preview' => $data['free_preview'] ?? false,
                'status' => 'published',
                'is_published' => true,
                'locked' => $data['locked'] ?? false,
                'featured' => $data['featured'] ?? false,
                'color' => $data['color'] ?? null,
                'icon' => $data['icon'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            return $section;
        });
    }

    public function update(Course $course, CourseSection $section, array $data): CourseSection
    {
        return DB::transaction(function () use ($course, $section, $data): CourseSection {
            $this->ensureSectionBelongsToCourse($course, $section);

            $updateData = collect($data)->only([
                'title', 'description', 'sort_order', 'duration_minutes',
                'free_preview', 'locked', 'featured', 'color', 'icon', 'notes',
            ])->all();

            if (array_key_exists('slug', $data)) {
                $updateData['slug'] = $this->uniqueSectionSlug($course, $data['slug'], $section);
            } elseif (array_key_exists('title', $data) && ! array_key_exists('slug', $data)) {
                $updateData['slug'] = $this->uniqueSectionSlug($course, $data['title'], $section);
            }

            return $this->repository->update($section, $updateData);
        });
    }

    public function delete(Course $course, CourseSection $section): void
    {
        $this->ensureSectionBelongsToCourse($course, $section);
        $this->repository->delete($section);
    }

    public function restore(Course $course, int $id): ?CourseSection
    {
        return $this->repository->restore($id, $course);
    }

    public function duplicate(Course $course, CourseSection $section): CourseSection
    {
        return DB::transaction(function () use ($course, $section): CourseSection {
            $this->ensureSectionBelongsToCourse($course, $section);

            $newSection = $this->repository->create([
                'tenant_id' => $course->tenant_id,
                'course_id' => $course->id,
                'course_module_id' => $section->course_module_id,
                'title' => $section->title . ' (نسخة)',
                'slug' => $this->uniqueSectionSlug($course, $section->slug . '-copy'),
                'description' => $section->description,
                'sort_order' => $this->nextSortOrder($course),
                'duration_minutes' => $section->duration_minutes,
                'free_preview' => $section->free_preview,
                'status' => 'draft',
                'is_published' => false,
                'published' => false,
                'locked' => false,
                'featured' => false,
                'color' => $section->color,
                'icon' => $section->icon,
                'notes' => $section->notes,
            ]);

            $order = 0;
            foreach ($section->lessons()->orderBy('sort_order')->get() as $lesson) {
                $order++;
                CourseLesson::create([
                    'tenant_id' => $course->tenant_id,
                    'course_id' => $course->id,
                    'course_section_id' => $newSection->id,
                    'title' => $lesson->title,
                    'slug' => $this->uniqueLessonSlug($course, $newSection, $lesson->slug . '-copy'),
                    'short_description' => $lesson->short_description,
                    'description' => $lesson->description,
                    'type' => $lesson->type,
                    'lesson_type' => $lesson->lesson_type,
                    'status' => 'draft',
                    'visibility' => $lesson->visibility,
                    'sort_order' => $order,
                    'duration_seconds' => $lesson->duration_seconds,
                    'estimated_duration' => $lesson->estimated_duration,
                    'free_preview' => false,
                    'downloadable' => $lesson->downloadable,
                    'featured' => false,
                    'comments_enabled' => $lesson->comments_enabled,
                    'notes' => $lesson->notes,
                    'color' => $lesson->color,
                    'icon' => $lesson->icon,
                    'published_at' => null,
                ]);
            }

            return $newSection;
        });
    }

    public function move(Course $course, CourseSection $section, ?int $moduleId, ?int $sortOrder): CourseSection
    {
        $this->ensureSectionBelongsToCourse($course, $section);

        $data = [];

        if ($moduleId !== null) {
            $data['course_module_id'] = $moduleId;
        }

        if ($sortOrder !== null) {
            $data['sort_order'] = $sortOrder;
        } elseif ($moduleId !== null && $section->course_module_id !== $moduleId) {
            $data['sort_order'] = $this->nextSortOrder($course);
        }

        if (empty($data)) {
            return $section;
        }

        return $this->repository->update($section, $data);
    }

    private function uniqueLessonSlug(Course $course, CourseSection $section, string $value): string
    {
        $slug = Str::slug($value);

        if ($slug === '') {
            $slug = 'lesson-' . Str::random(6);
        }

        $query = CourseLesson::withTrashed()
            ->where('tenant_id', $course->tenant_id)
            ->where('course_id', $course->id)
            ->where('course_section_id', $section->id)
            ->where('slug', $slug);

        $counter = 1;
        $base = $slug;
        while ($query->exists()) {
            $slug = $base . '-' . $counter;
            $counter++;
            $query->where('slug', $slug);
        }

        return $slug;
    }

    public function changeStatus(Course $course, CourseSection $section, string $status): CourseSection
    {
        $this->ensureSectionBelongsToCourse($course, $section);

        if ($status === $section->status) {
            return $section;
        }

        $allowed = [
            'draft' => ['published', 'archived'],
            'published' => ['draft', 'archived'],
            'archived' => ['draft', 'published'],
        ];

        if (! in_array($status, $allowed[$section->status] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition section from {$section->status} to {$status}."],
            ]);
        }

        return $this->repository->update($section, [
            'status' => $status,
            'is_published' => $status === 'published',
            'published' => $status === 'published',
        ]);
    }

    public function publish(Course $course, CourseSection $section): CourseSection
    {
        return $this->changeStatus($course, $section, 'published');
    }

    public function unpublish(Course $course, CourseSection $section): CourseSection
    {
        return $this->changeStatus($course, $section, 'draft');
    }

    public function toggleLocked(Course $course, CourseSection $section): CourseSection
    {
        $this->ensureSectionBelongsToCourse($course, $section);

        return $this->repository->update($section, [
            'locked' => ! $section->locked,
        ]);
    }

    public function toggleFeatured(Course $course, CourseSection $section): CourseSection
    {
        $this->ensureSectionBelongsToCourse($course, $section);

        return $this->repository->update($section, [
            'featured' => ! $section->featured,
        ]);
    }

    public function reorder(Course $course, array $sections): void
    {
        DB::transaction(function () use ($course, $sections): void {
            $ids = collect($sections)->pluck('id')->unique()->values();

            if ($ids->count() !== count($sections)) {
                throw ValidationException::withMessages([
                    'sections' => ['Duplicate section ids are not allowed.'],
                ]);
            }

            $existing = CourseSection::query()
                ->where('tenant_id', $course->tenant_id)
                ->where('course_id', $course->id)
                ->whereIn('id', $ids->all())
                ->pluck('id');

            if ($existing->count() !== $ids->count()) {
                throw ValidationException::withMessages([
                    'sections' => ['One or more sections are invalid for this course.'],
                ]);
            }

            foreach ($sections as $section) {
                CourseSection::query()
                    ->where('tenant_id', $course->tenant_id)
                    ->where('course_id', $course->id)
                    ->whereKey($section['id'])
                    ->update(['sort_order' => $section['sort_order']]);
            }
        });
    }

    public function getMetrics(?Course $course = null): array
    {
        return [
            'totalSections' => $this->repository->countTotal($course),
            'published' => $this->repository->countPublished($course),
            'draft' => $this->repository->countDraft($course),
            'locked' => $this->repository->countLocked($course),
            'freePreview' => $this->repository->countFreePreview($course),
            'avgDuration' => $this->repository->avgDuration($course),
            'totalLessons' => $this->repository->countLessonsTotal($course),
        ];
    }

    public function exportCsv(Course $course): StreamedResponse
    {
        $sections = $this->repository->listAll([], $course);

        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="sections_' . now()->format('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($sections): void {
            $handle = fopen('php://output', 'wb');
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Title', 'Slug', 'Description', 'Order', 'Duration (min)',
                'Status', 'Published', 'Locked', 'Featured', 'Free Preview',
                'Course', 'Lessons', 'Created At',
            ]);

            foreach ($sections as $section) {
                fputcsv($handle, [
                    $section->title,
                    $section->slug,
                    $section->description,
                    $section->sort_order,
                    $section->duration_minutes,
                    $section->status,
                    $section->is_published ? 'Yes' : 'No',
                    $section->locked ? 'Yes' : 'No',
                    $section->featured ? 'Yes' : 'No',
                    $section->free_preview ? 'Yes' : 'No',
                    $section->course?->title,
                    $section->lessons_count ?? 0,
                    $section->created_at->toIso8601String(),
                ]);
            }

            fclose($handle);
        };

        return new StreamedResponse($callback, 200, $headers);
    }

    public function nextSortOrder(Course $course): int
    {
        return ((int) CourseSection::query()
            ->where('tenant_id', $course->tenant_id)
            ->where('course_id', $course->id)
            ->max('sort_order')) + 1;
    }

    private function uniqueSectionSlug(Course $course, string $value, ?CourseSection $ignore = null): string
    {
        $slug = Str::slug($value);

        if ($slug === '') {
            $slug = 'section-' . Str::random(6);
        }

        $base = $slug;
        $counter = 1;

        while (true) {
            $query = CourseSection::withTrashed()
                ->where('tenant_id', $course->tenant_id)
                ->where('course_id', $course->id)
                ->where('slug', $slug);

            if ($ignore) {
                $query->whereKeyNot($ignore->id);
            }

            if (! $query->exists()) {
                return $slug;
            }

            $slug = $base . '-' . $counter;
            $counter++;
        }
    }

    private function ensureSectionBelongsToCourse(Course $course, CourseSection $section): void
    {
        if ($section->tenant_id !== $course->tenant_id || $section->course_id !== $course->id) {
            throw ValidationException::withMessages([
                'section' => ['The selected section is invalid for this course.'],
            ]);
        }
    }
}
