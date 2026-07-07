<?php

namespace App\Repositories;

use App\Models\Course;
use App\Models\CourseSection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class CourseSectionRepository
{
    protected array $allowedSorts = [
        'title', 'sort_order', 'status', 'duration_minutes',
        'free_preview', 'published', 'locked', 'featured',
        'created_at', 'updated_at',
    ];

    public function query(?Course $course = null): Builder
    {
        $query = CourseSection::query()
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

    public function withLessonsCount(Builder $query): Builder
    {
        return $query->withCount('lessons');
    }

    public function list(array $params = [], ?Course $course = null): LengthAwarePaginator
    {
        $query = $this->query($course);

        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->applyCourseFilter($query, $params['course_id'] ?? null);
        $query = $this->applyModuleFilter($query, $params['course_module_id'] ?? null);
        $query = $this->applyStatusFilter($query, $params['status'] ?? null);
        $query = $this->applyPublishedFilter($query, $params['published'] ?? null);
        $query = $this->applyLockedFilter($query, $params['locked'] ?? null);
        $query = $this->applySort($query, $params['sort'] ?? null, $params['sort_dir'] ?? null);
        $query = $this->withLessonsCount($query);

        return $query->paginate((int) ($params['per_page'] ?? 25));
    }

    public function listAll(array $params = [], ?Course $course = null): Collection
    {
        $query = $this->query($course);
        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->withLessonsCount($query);

        return $query->get();
    }

    public function findById(int $id, ?Course $course = null): ?CourseSection
    {
        $query = $this->query($course)->where('id', $id);
        return $query->first();
    }

    public function findByIdOrFail(int $id, ?Course $course = null): CourseSection
    {
        $query = $this->query($course)->where('id', $id);
        return $query->firstOrFail();
    }

    public function create(array $data): CourseSection
    {
        $data['tenant_id'] = currentTenant()->id;
        $section = CourseSection::create($data);
        $section->load($this->defaultEagerLoads());
        return $section;
    }

    public function update(CourseSection $section, array $data): CourseSection
    {
        $section->fill(collect($data)->only($section->getFillable())->all())->save();
        return $section->refresh()->load($this->defaultEagerLoads());
    }

    public function delete(CourseSection $section): bool
    {
        return (bool) $section->delete();
    }

    public function restore(int $id, ?Course $course = null): ?CourseSection
    {
        $query = CourseSection::onlyTrashed()
            ->where('tenant_id', currentTenant()->id)
            ->where('id', $id);

        if ($course) {
            $query->where('course_id', $course->id);
        }

        $section = $query->first();

        if ($section) {
            $section->restore();
            return $section->load($this->defaultEagerLoads());
        }

        return null;
    }

    public function countTotal(?Course $course = null): int
    {
        $query = CourseSection::query()
            ->where('tenant_id', currentTenant()->id);

        if ($course) {
            $query->where('course_id', $course->id);
        }

        return $query->count();
    }

    public function countPublished(?Course $course = null): int
    {
        $query = CourseSection::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('is_published', true);

        if ($course) {
            $query->where('course_id', $course->id);
        }

        return $query->count();
    }

    public function countDraft(?Course $course = null): int
    {
        $query = CourseSection::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('status', 'draft');

        if ($course) {
            $query->where('course_id', $course->id);
        }

        return $query->count();
    }

    public function countLocked(?Course $course = null): int
    {
        $query = CourseSection::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('locked', true);

        if ($course) {
            $query->where('course_id', $course->id);
        }

        return $query->count();
    }

    public function countFreePreview(?Course $course = null): int
    {
        $query = CourseSection::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('free_preview', true);

        if ($course) {
            $query->where('course_id', $course->id);
        }

        return $query->count();
    }

    public function avgDuration(?Course $course = null): float
    {
        $query = CourseSection::query()
            ->where('tenant_id', currentTenant()->id)
            ->whereNotNull('duration_minutes');

        if ($course) {
            $query->where('course_id', $course->id);
        }

        return round((float) $query->avg('duration_minutes'), 1);
    }

    public function countLessonsTotal(?Course $course = null): int
    {
        $query = CourseSection::query()
            ->where('tenant_id', currentTenant()->id);

        if ($course) {
            $query->where('course_id', $course->id);
        }

        return (int) $query->withCount('lessons')->get()->sum('lessons_count');
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

    protected function applyPublishedFilter(Builder $query, $published): Builder
    {
        if ($published === null || $published === 'all') {
            return $query;
        }
        return $query->where('is_published', filter_var($published, FILTER_VALIDATE_BOOLEAN));
    }

    protected function applyLockedFilter(Builder $query, $locked): Builder
    {
        if ($locked === null || $locked === 'all') {
            return $query;
        }
        return $query->where('locked', filter_var($locked, FILTER_VALIDATE_BOOLEAN));
    }

    protected function applySort(Builder $query, ?string $sort, ?string $dir): Builder
    {
        $sort = in_array($sort, $this->allowedSorts, true) ? $sort : 'sort_order';
        $dir = $dir === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sort, $dir);
    }

    protected function applyModuleFilter(Builder $query, $moduleId): Builder
    {
        if (! $moduleId) {
            return $query;
        }
        if ($moduleId === 'null') {
            return $query->whereNull('course_module_id');
        }
        return $query->where('course_module_id', $moduleId);
    }
}
