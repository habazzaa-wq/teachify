<?php

namespace App\Repositories;

use App\Models\Course;
use App\Models\CourseAnalytics;
use App\Models\CourseCompletion;
use App\Models\CourseEnrollment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class CourseRepository
{
    protected array $allowedSorts = [
        'title', 'status', 'visibility', 'difficulty', 'language',
        'duration', 'price_amount', 'featured',
        'published_at', 'created_at', 'updated_at',
    ];

    public function query(): Builder
    {
        return Course::query()
            ->where('tenant_id', currentTenant()->id)
            ->with($this->defaultEagerLoads());
    }

    protected function defaultEagerLoads(): array
    {
        return ['primaryInstructor.user', 'categories'];
    }

    public function withEnrollmentsCount(Builder $query): Builder
    {
        return $query->withCount('enrollments');
    }

    public function list(array $params = []): LengthAwarePaginator
    {
        $query = $this->query();

        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->applyStatusFilter($query, $params['status'] ?? null);
        $query = $this->applyVisibilityFilter($query, $params['visibility'] ?? null);
        $query = $this->applyDifficultyFilter($query, $params['difficulty'] ?? null);
        $query = $this->applyCategoryFilter($query, $params['category_id'] ?? null);
        $query = $this->applyInstructorFilter($query, $params['instructor_id'] ?? null);
        $query = $this->applyLanguageFilter($query, $params['language'] ?? null);
        $query = $this->applyPriceTypeFilter($query, $params['pricing_type'] ?? null);
        $query = $this->applyFeaturedFilter($query, $params['featured'] ?? null);
        $query = $this->applyDateRangeFilter($query, $params['date_from'] ?? null, $params['date_to'] ?? null);
        $query = $this->applySort($query, $params['sort'] ?? null, $params['sort_dir'] ?? null);
        $query = $this->withEnrollmentsCount($query);

        return $query->paginate((int) ($params['per_page'] ?? 25));
    }

    public function listAll(array $params = []): Collection
    {
        $query = $this->query();
        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->applyStatusFilter($query, $params['status'] ?? null);
        $query = $this->withEnrollmentsCount($query);

        return $query->get();
    }

    public function findById(int $id): ?Course
    {
        return $this->query()->where('id', $id)->first();
    }

    public function findByIdOrFail(int $id): Course
    {
        return $this->query()->where('id', $id)->firstOrFail();
    }

    public function create(array $data): Course
    {
        $data['tenant_id'] = currentTenant()->id;
        $course = Course::create($data);
        $course->load($this->defaultEagerLoads());
        return $course;
    }

    public function update(Course $course, array $data): Course
    {
        $course->fill(collect($data)->only($course->getFillable())->all())->save();
        return $course->refresh()->load($this->defaultEagerLoads());
    }

    public function delete(Course $course): bool
    {
        return (bool) $course->delete();
    }

    public function restore(int $id): ?Course
    {
        $course = Course::onlyTrashed()
            ->where('tenant_id', currentTenant()->id)
            ->where('id', $id)
            ->first();

        if ($course) {
            $course->restore();
            return $course->load($this->defaultEagerLoads());
        }

        return null;
    }

    public function countByStatus(string $status): int
    {
        return Course::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('status', $status)
            ->count();
    }

    public function countFeatured(): int
    {
        return Course::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('featured', true)
            ->count();
    }

    public function countEnrollmentsTotal(): int
    {
        return CourseEnrollment::query()
            ->whereHas('course', fn (Builder $q) => $q->where('tenant_id', currentTenant()->id))
            ->count();
    }

    public function sumRevenue(): int
    {
        return Course::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('status', 'published')
            ->where('pricing_type', 'one_time')
            ->sum('price_amount');
    }

    public function avgRating(): float
    {
        return round(CourseAnalytics::query()
            ->whereHas('course', fn (Builder $q) => $q->where('tenant_id', currentTenant()->id))
            ->avg('avg_rating'), 1);
    }

    public function completionRate(): float
    {
        $total = CourseEnrollment::query()
            ->whereHas('course', fn (Builder $q) => $q->where('tenant_id', currentTenant()->id))
            ->count();

        if ($total === 0) {
            return 0;
        }

        $completed = CourseCompletion::query()
            ->whereHas('course', fn (Builder $q) => $q->where('tenant_id', currentTenant()->id))
            ->count();

        return round(($completed / $total) * 100, 1);
    }

    protected function applySearch(Builder $query, ?string $search): Builder
    {
        if (! $search) {
            return $query;
        }

        $search = '%' . $search . '%';
        return $query->where(function (Builder $q) use ($search): void {
            $q->where('title', 'like', $search)
                ->orWhere('short_description', 'like', $search)
                ->orWhere('slug', 'like', $search)
                ->orWhereHas('primaryInstructor.user', function (Builder $uq) use ($search): void {
                    $uq->where('name', 'like', $search);
                });
        });
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

    protected function applyDifficultyFilter(Builder $query, ?string $difficulty): Builder
    {
        if (! $difficulty || $difficulty === 'all') {
            return $query;
        }
        return $query->where('difficulty', $difficulty);
    }

    protected function applyCategoryFilter(Builder $query, $categoryId): Builder
    {
        if (! $categoryId) {
            return $query;
        }
        return $query->whereHas('categories', fn (Builder $q) => $q->where('categories.id', $categoryId));
    }

    protected function applyInstructorFilter(Builder $query, $instructorId): Builder
    {
        if (! $instructorId) {
            return $query;
        }
        return $query->where(function (Builder $q) use ($instructorId): void {
            $q->where('primary_instructor_tenant_user_id', $instructorId)
                ->orWhereHas('instructors', fn (Builder $iq) => $iq->where('tenant_user_id', $instructorId));
        });
    }

    protected function applyLanguageFilter(Builder $query, ?string $language): Builder
    {
        if (! $language || $language === 'all') {
            return $query;
        }
        return $query->where('language', $language);
    }

    protected function applyPriceTypeFilter(Builder $query, ?string $pricingType): Builder
    {
        if (! $pricingType || $pricingType === 'all') {
            return $query;
        }
        return $query->where('pricing_type', $pricingType);
    }

    protected function applyFeaturedFilter(Builder $query, $featured): Builder
    {
        if ($featured === null || $featured === 'all') {
            return $query;
        }
        return $query->where('featured', filter_var($featured, FILTER_VALIDATE_BOOLEAN));
    }

    protected function applyDateRangeFilter(Builder $query, ?string $from, ?string $to): Builder
    {
        if ($from) {
            $query->where('created_at', '>=', $from);
        }
        if ($to) {
            $query->where('created_at', '<=', $to);
        }
        return $query;
    }

    protected function applySort(Builder $query, ?string $sort, ?string $dir): Builder
    {
        $sort = in_array($sort, $this->allowedSorts, true) ? $sort : 'created_at';
        $dir = $dir === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sort, $dir);
    }
}
