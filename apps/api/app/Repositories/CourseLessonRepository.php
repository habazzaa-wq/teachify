<?php

namespace App\Repositories;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class CourseLessonRepository
{
    protected array $allowedSorts = [
        'title', 'sort_order', 'status', 'visibility',
        'lesson_type', 'duration_seconds', 'estimated_duration',
        'free_preview', 'featured', 'created_at', 'updated_at',
    ];

    public function query(?Course $course = null, ?CourseSection $section = null): Builder
    {
        $query = CourseLesson::query()
            ->where('tenant_id', currentTenant()->id)
            ->with($this->defaultEagerLoads());

        if ($course) {
            $query->where('course_id', $course->id);
        }

        if ($section) {
            $query->where('course_section_id', $section->id);
        }

        return $query;
    }

    protected function defaultEagerLoads(): array
    {
        return [
            'course:id,title,slug,tenant_id',
            'section:id,title,slug,tenant_id',
        ];
    }

    public function withRelations(Builder $query): Builder
    {
        return $query;
    }

    public function list(array $params = [], ?Course $course = null, ?CourseSection $section = null): LengthAwarePaginator
    {
        $query = $this->query($course, $section);

        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->applyCourseFilter($query, $params['course_id'] ?? null);
        $query = $this->applySectionFilter($query, $params['section_id'] ?? null);
        $query = $this->applyStatusFilter($query, $params['status'] ?? null);
        $query = $this->applyVisibilityFilter($query, $params['visibility'] ?? null);
        $query = $this->applyLessonTypeFilter($query, $params['lesson_type'] ?? null);
        $query = $this->applyFeaturedFilter($query, $params['featured'] ?? null);
        $query = $this->applyFreePreviewFilter($query, $params['free_preview'] ?? null);
        $query = $this->applySort($query, $params['sort'] ?? null, $params['sort_dir'] ?? null);
        $query = $this->withRelations($query);

        return $query->paginate((int) ($params['per_page'] ?? 50));
    }

    public function listAll(array $params = [], ?Course $course = null, ?CourseSection $section = null): Collection
    {
        $query = $this->query($course, $section);
        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->withRelations($query);

        return $query->get();
    }

    public function findById(int $id, ?Course $course = null, ?CourseSection $section = null): ?CourseLesson
    {
        $query = $this->query($course, $section)->where('id', $id);
        return $query->first();
    }

    public function findByIdOrFail(int $id, ?Course $course = null, ?CourseSection $section = null): CourseLesson
    {
        $query = $this->query($course, $section)->where('id', $id);
        return $query->firstOrFail();
    }

    public function create(array $data): CourseLesson
    {
        $data['tenant_id'] = currentTenant()->id;
        $lesson = CourseLesson::create($data);
        $lesson->load($this->defaultEagerLoads());
        return $lesson;
    }

    public function update(CourseLesson $lesson, array $data): CourseLesson
    {
        $lesson->fill(collect($data)->only($lesson->getFillable())->all())->save();
        return $lesson->refresh()->load($this->defaultEagerLoads());
    }

    public function delete(CourseLesson $lesson): bool
    {
        return (bool) $lesson->delete();
    }

    public function restore(int $id, ?Course $course = null, ?CourseSection $section = null): ?CourseLesson
    {
        $query = CourseLesson::withTrashed()
            ->where('tenant_id', currentTenant()->id)
            ->where('id', $id);

        if ($course) {
            $query->where('course_id', $course->id);
        }

        if ($section) {
            $query->where('course_section_id', $section->id);
        }

        $lesson = $query->first();

        if ($lesson) {
            $lesson->restore();
            $lesson->forceFill([
                'status' => 'published',
                'published_at' => now(),
            ])->save();

            return $lesson->refresh()->load($this->defaultEagerLoads());
        }

        return null;
    }

    public function countTotal(?Course $course = null, ?CourseSection $section = null): int
    {
        $query = CourseLesson::query()->where('tenant_id', currentTenant()->id);

        if ($course) {
            $query->where('course_id', $course->id);
        }

        if ($section) {
            $query->where('course_section_id', $section->id);
        }

        return $query->count();
    }

    public function countByStatus(string $status, ?Course $course = null, ?CourseSection $section = null): int
    {
        $query = CourseLesson::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('status', $status);

        if ($course) {
            $query->where('course_id', $course->id);
        }

        if ($section) {
            $query->where('course_section_id', $section->id);
        }

        return $query->count();
    }

    public function countFeatured(?Course $course = null, ?CourseSection $section = null): int
    {
        $query = CourseLesson::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('featured', true);

        if ($course) {
            $query->where('course_id', $course->id);
        }

        if ($section) {
            $query->where('course_section_id', $section->id);
        }

        return $query->count();
    }

    public function countFreePreview(?Course $course = null, ?CourseSection $section = null): int
    {
        $query = CourseLesson::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('free_preview', true);

        if ($course) {
            $query->where('course_id', $course->id);
        }

        if ($section) {
            $query->where('course_section_id', $section->id);
        }

        return $query->count();
    }

    public function avgDuration(?Course $course = null, ?CourseSection $section = null): float
    {
        $query = CourseLesson::query()
            ->where('tenant_id', currentTenant()->id)
            ->whereNotNull('estimated_duration');

        if ($course) {
            $query->where('course_id', $course->id);
        }

        if ($section) {
            $query->where('course_section_id', $section->id);
        }

        return round((float) $query->avg('estimated_duration'), 1);
    }

    protected function applySearch(Builder $query, ?string $search): Builder
    {
        if (! $search) {
            return $query;
        }

        $search = '%' . $search . '%';
        return $query->where(function (Builder $q) use ($search): void {
            $q->where('title', 'like', $search)
                ->orWhere('short_description', 'like', $search);
        });
    }

    protected function applyCourseFilter(Builder $query, $courseId): Builder
    {
        if (! $courseId) {
            return $query;
        }
        return $query->where('course_id', $courseId);
    }

    protected function applySectionFilter(Builder $query, $sectionId): Builder
    {
        if (! $sectionId) {
            return $query;
        }
        return $query->where('course_section_id', $sectionId);
    }

    protected function applyStatusFilter(Builder $query, ?string $status): Builder
    {
        if (! $status || $status === 'all') {
            return $query;
        }
        return $query->where('status', $status);
    }

    protected function applyVisibilityFilter(Builder $query, ?string $visibility): Builder
    {
        if (! $visibility || $visibility === 'all') {
            return $query;
        }
        return $query->where('visibility', $visibility);
    }

    protected function applyLessonTypeFilter(Builder $query, ?string $lessonType): Builder
    {
        if (! $lessonType || $lessonType === 'all') {
            return $query;
        }
        return $query->where(function (Builder $q) use ($lessonType): void {
            $q->where('lesson_type', $lessonType)
              ->orWhere('type', $lessonType);
        });
    }

    protected function applyFeaturedFilter(Builder $query, $featured): Builder
    {
        if ($featured === null || $featured === 'all') {
            return $query;
        }
        return $query->where('featured', filter_var($featured, FILTER_VALIDATE_BOOLEAN));
    }

    protected function applyFreePreviewFilter(Builder $query, $freePreview): Builder
    {
        if ($freePreview === null || $freePreview === 'all') {
            return $query;
        }
        return $query->where('free_preview', filter_var($freePreview, FILTER_VALIDATE_BOOLEAN));
    }

    protected function applySort(Builder $query, ?string $sort, ?string $dir): Builder
    {
        $sort = in_array($sort, $this->allowedSorts, true) ? $sort : 'sort_order';
        $dir = $dir === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sort, $dir);
    }
}
