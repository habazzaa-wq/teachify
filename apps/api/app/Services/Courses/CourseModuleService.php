<?php

namespace App\Services\Courses;

use App\Models\Course;
use App\Models\CourseModule;
use App\Repositories\CourseModuleRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CourseModuleService
{
    public function __construct(
        private readonly CourseModuleRepository $repository,
    ) {}

    public function list(Course $course, array $params = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return $this->repository->list($params, $course);
    }

    public function get(Course $course, int $id): CourseModule
    {
        return $this->repository->findByIdOrFail($id, $course);
    }

    public function create(Course $course, array $data): CourseModule
    {
        return DB::transaction(function () use ($course, $data): CourseModule {
            $module = $this->repository->create([
                'tenant_id' => $course->tenant_id,
                'course_id' => $course->id,
                'title' => $data['title'],
                'slug' => $this->uniqueModuleSlug($course, $data['slug'] ?? $data['title']),
                'description' => $data['description'] ?? null,
                'order' => $data['order'] ?? $this->nextSortOrder($course),
                'status' => 'draft',
                'is_published' => false,
                'featured' => $data['featured'] ?? false,
                'estimated_duration' => $data['estimated_duration'] ?? null,
                'color' => $data['color'] ?? null,
                'icon' => $data['icon'] ?? null,
                'notes' => $data['notes'] ?? null,
                'published_at' => null,
            ]);

            return $module;
        });
    }

    public function update(Course $course, CourseModule $module, array $data): CourseModule
    {
        return DB::transaction(function () use ($course, $module, $data): CourseModule {
            $this->ensureModuleBelongsToCourse($course, $module);

            $updateData = collect($data)->only([
                'title', 'description', 'order', 'estimated_duration',
                'featured', 'color', 'icon', 'notes',
            ])->all();

            if (array_key_exists('slug', $data)) {
                $updateData['slug'] = $this->uniqueModuleSlug($course, $data['slug'], $module);
            } elseif (array_key_exists('title', $data) && ! array_key_exists('slug', $data)) {
                $updateData['slug'] = $this->uniqueModuleSlug($course, $data['title'], $module);
            }

            return $this->repository->update($module, $updateData);
        });
    }

    public function delete(Course $course, CourseModule $module): void
    {
        $this->ensureModuleBelongsToCourse($course, $module);
        $this->repository->delete($module);
    }

    public function restore(Course $course, int $id): ?CourseModule
    {
        return $this->repository->restore($id, $course);
    }

    public function duplicate(Course $course, CourseModule $module): CourseModule
    {
        return DB::transaction(function () use ($course, $module): CourseModule {
            $this->ensureModuleBelongsToCourse($course, $module);

            return $this->repository->create([
                'tenant_id' => $course->tenant_id,
                'course_id' => $course->id,
                'title' => $module->title . ' (نسخة)',
                'slug' => $this->uniqueModuleSlug($course, $module->slug . '-copy'),
                'description' => $module->description,
                'order' => $this->nextSortOrder($course),
                'status' => 'draft',
                'is_published' => false,
                'featured' => false,
                'estimated_duration' => $module->estimated_duration,
                'color' => $module->color,
                'icon' => $module->icon,
                'notes' => $module->notes,
                'published_at' => null,
            ]);
        });
    }

    public function changeStatus(Course $course, CourseModule $module, string $status): CourseModule
    {
        $this->ensureModuleBelongsToCourse($course, $module);

        $allowed = [
            'draft' => ['published', 'archived'],
            'published' => ['draft', 'archived'],
            'archived' => ['draft', 'published'],
        ];

        if (! in_array($status, $allowed[$module->status] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition module from {$module->status} to {$status}."],
            ]);
        }

        return $this->repository->update($module, [
            'status' => $status,
            'is_published' => $status === 'published',
            'published_at' => $status === 'published' ? now() : ($status === 'draft' ? null : $module->published_at),
        ]);
    }

    public function publish(Course $course, CourseModule $module): CourseModule
    {
        return $this->changeStatus($course, $module, 'published');
    }

    public function archive(Course $course, CourseModule $module): CourseModule
    {
        return $this->changeStatus($course, $module, 'archived');
    }

    public function toggleFeatured(Course $course, CourseModule $module): CourseModule
    {
        $this->ensureModuleBelongsToCourse($course, $module);

        return $this->repository->update($module, [
            'featured' => ! $module->featured,
        ]);
    }

    public function reorder(Course $course, array $modules): void
    {
        DB::transaction(function () use ($course, $modules): void {
            $ids = collect($modules)->pluck('id')->unique()->values();

            if ($ids->count() !== count($modules)) {
                throw ValidationException::withMessages([
                    'modules' => ['Duplicate module ids are not allowed.'],
                ]);
            }

            $existing = CourseModule::query()
                ->where('tenant_id', $course->tenant_id)
                ->where('course_id', $course->id)
                ->whereIn('id', $ids->all())
                ->pluck('id');

            if ($existing->count() !== $ids->count()) {
                throw ValidationException::withMessages([
                    'modules' => ['One or more modules are invalid for this course.'],
                ]);
            }

            foreach ($modules as $mod) {
                CourseModule::query()
                    ->where('tenant_id', $course->tenant_id)
                    ->where('course_id', $course->id)
                    ->whereKey($mod['id'])
                    ->update(['order' => $mod['order']]);
            }
        });
    }

    public function getMetrics(?Course $course = null): array
    {
        return [
            'totalModules' => $this->repository->countTotal($course),
            'published' => $this->repository->countPublished($course),
            'draft' => $this->repository->countDraft($course),
            'featured' => $this->repository->countFeatured($course),
            'avgDuration' => $this->repository->avgDuration($course),
            'totalSections' => $this->repository->countSectionsTotal($course),
        ];
    }

    public function exportCsv(Course $course): StreamedResponse
    {
        $modules = $this->repository->listAll([], $course);

        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="modules_' . now()->format('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($modules): void {
            $handle = fopen('php://output', 'wb');
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Title', 'Slug', 'Description', 'Order',
                'Status', 'Published', 'Featured',
                'Course', 'Sections', 'Created At',
            ]);

            foreach ($modules as $module) {
                fputcsv($handle, [
                    $module->title,
                    $module->slug,
                    $module->description,
                    $module->order,
                    $module->status,
                    $module->is_published ? 'Yes' : 'No',
                    $module->featured ? 'Yes' : 'No',
                    $module->course?->title,
                    $module->sections_count ?? 0,
                    $module->created_at->toIso8601String(),
                ]);
            }

            fclose($handle);
        };

        return new StreamedResponse($callback, 200, $headers);
    }

    public function nextSortOrder(Course $course): int
    {
        return ((int) CourseModule::query()
            ->where('tenant_id', $course->tenant_id)
            ->where('course_id', $course->id)
            ->max('order')) + 1;
    }

    private function uniqueModuleSlug(Course $course, string $value, ?CourseModule $ignore = null): string
    {
        $slug = Str::slug($value);

        if ($slug === '') {
            $slug = 'module-' . Str::random(6);
        }

        $base = $slug;
        $counter = 1;

        while (true) {
            $query = CourseModule::withTrashed()
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

    private function ensureModuleBelongsToCourse(Course $course, CourseModule $module): void
    {
        if ($module->tenant_id !== $course->tenant_id || $module->course_id !== $course->id) {
            throw ValidationException::withMessages([
                'module' => ['The selected module is invalid for this course.'],
            ]);
        }
    }
}
