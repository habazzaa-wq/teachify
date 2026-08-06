<?php

namespace App\Repositories;

use App\Models\Course;
use App\Models\CourseModule;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class CourseModuleRepository
{
    protected array $allowedSorts = [
        'title', 'order', 'status', 'estimated_duration',
        'featured', 'created_at', 'updated_at',
    ];

    public function query(?Course $course = null): Builder
    {
        $query = CourseModule::query()
            ->where('tenant_id', currentTenant()->id)
            ->with($this->defaultEagerLoads());

        if ($course) {
            $query->where('course_id', $course->id);
        }

        return $query;
    }

    protected function defaultEagerLoads(): array
    {
        return ['course:id,title,slug,tenant_id'];
    }

    public function withSectionsCount(Builder $query): Builder
    {
        return $query->withCount('sections');
    }

    public function list(array $params = [], ?Course $course = null): LengthAwarePaginator
    {
        $query = $this->query($course);

        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->applyCourseFilter($query, $params['course_id'] ?? null);
        $query = $this->applyStatusFilter($query, $params['status'] ?? null);
        $query = $this->applyFeaturedFilter($query, $params['featured'] ?? null);
        $query = $this->applySort($query, $params['sort'] ?? null, $params['sort_dir'] ?? null);
        $query = $this->withSectionsCount($query);

        return $query->paginate((int) ($params['per_page'] ?? 25));
    }

    public function listAll(array $params = [], ?Course $course = null): Collection
    {
        $query = $this->query($course);
        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->withSectionsCount($query);

        return $query->get();
    }

    public function findById(int $id, ?Course $course = null): ?CourseModule
    {
        $query = $this->query($course)->where('id', $id);
        return $query->first();
    }

    public function findByIdOrFail(int $id, ?Course $course = null): CourseModule
    {
        $query = $this->query($course)->where('id', $id);
        return $query->firstOrFail();
    }

    public function create(array $data): CourseModule
    {
        $data['tenant_id'] = currentTenant()->id;
        $module = CourseModule::create($data);
        $module->load($this->defaultEagerLoads());
        return $module;
    }

    public function update(CourseModule $module, array $data): CourseModule
    {
        $module->fill(collect($data)->only($module->getFillable())->all())->save();
        return $module->refresh()->load($this->defaultEagerLoads());
    }

    public function delete(CourseModule $module): bool
    {
        return (bool) $module->delete();
    }

    public function restore(int $id, ?Course $course = null): ?CourseModule
    {
        $query = CourseModule::withTrashed()
            ->where('tenant_id', currentTenant()->id)
            ->where('id', $id);

        if ($course) {
            $query->where('course_id', $course->id);
        }

        $module = $query->first();

        if ($module) {
            $module->restore();
            $module->forceFill([
                'status' => 'published',
                'is_published' => true,
                'published_at' => now(),
            ])->save();

            return $module->refresh()->load($this->defaultEagerLoads());
        }

        return null;
    }

    public function countTotal(?Course $course = null): int
    {
        $query = CourseModule::query()
            ->where('tenant_id', currentTenant()->id);

        if ($course) {
            $query->where('course_id', $course->id);
        }

        return $query->count();
    }

    public function countPublished(?Course $course = null): int
    {
        $query = CourseModule::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('is_published', true);

        if ($course) {
            $query->where('course_id', $course->id);
        }

        return $query->count();
    }

    public function countDraft(?Course $course = null): int
    {
        $query = CourseModule::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('status', 'draft');

        if ($course) {
            $query->where('course_id', $course->id);
        }

        return $query->count();
    }

    public function countFeatured(?Course $course = null): int
    {
        $query = CourseModule::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('featured', true);

        if ($course) {
            $query->where('course_id', $course->id);
        }

        return $query->count();
    }

    public function avgDuration(?Course $course = null): float
    {
        $query = CourseModule::query()
            ->where('tenant_id', currentTenant()->id)
            ->whereNotNull('estimated_duration');

        if ($course) {
            $query->where('course_id', $course->id);
        }

        return round((float) $query->avg('estimated_duration'), 1);
    }

    public function countSectionsTotal(?Course $course = null): int
    {
        $query = CourseModule::query()
            ->where('tenant_id', currentTenant()->id);

        if ($course) {
            $query->where('course_id', $course->id);
        }

        return (int) $query->withCount('sections')->get()->sum('sections_count');
    }

    protected function applySearch(Builder $query, ?string $search): Builder
    {
        if (! $search) {
            return $query;
        }

        $search = '%' . $search . '%';
        return $query->where(function (Builder $q) use ($search): void {
            $q->where('title', 'like', $search)
                ->orWhere('description', 'like', $search);
        });
    }

    protected function applyCourseFilter(Builder $query, $courseId): Builder
    {
        if (! $courseId) {
            return $query;
        }
        return $query->where('course_id', $courseId);
    }

    protected function applyStatusFilter(Builder $query, ?string $status): Builder
    {
        if (! $status || $status === 'all') {
            return $query;
        }
        return $query->where('status', $status);
    }

    protected function applyFeaturedFilter(Builder $query, $featured): Builder
    {
        if ($featured === null || $featured === 'all') {
            return $query;
        }
        return $query->where('featured', filter_var($featured, FILTER_VALIDATE_BOOLEAN));
    }

    protected function applySort(Builder $query, ?string $sort, ?string $dir): Builder
    {
        $sort = in_array($sort, $this->allowedSorts, true) ? $sort : 'order';
        $dir = $dir === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sort, $dir);
    }
}
