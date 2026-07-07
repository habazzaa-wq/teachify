<?php

namespace App\Services\Courses;

use App\Models\Course;
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

    public function list(Course $course, array $params = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return $this->repository->list($params, $course);
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
                'title' => $data['title'],
                'slug' => $this->uniqueSectionSlug($course, $data['slug'] ?? $data['title']),
                'description' => $data['description'] ?? null,
                'sort_order' => $data['sort_order'] ?? $this->nextSortOrder($course),
                'duration_minutes' => $data['duration_minutes'] ?? null,
                'free_preview' => $data['free_preview'] ?? false,
                'status' => 'draft',
                'is_published' => false,
                'published' => false,
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

            return $this->repository->create([
                'tenant_id' => $course->tenant_id,
                'course_id' => $course->id,
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
        });
    }

    public function changeStatus(Course $course, CourseSection $section, string $status): CourseSection
    {
        $this->ensureSectionBelongsToCourse($course, $section);

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
            throw ValidationException::withMessages([
                'slug' => ['The section slug is invalid.'],
            ]);
        }

        $query = CourseSection::query()
            ->where('tenant_id', $course->tenant_id)
            ->where('course_id', $course->id)
            ->where('slug', $slug);

        if ($ignore) {
            $query->whereKeyNot($ignore->id);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'slug' => ['The section slug has already been taken in this course.'],
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
}
