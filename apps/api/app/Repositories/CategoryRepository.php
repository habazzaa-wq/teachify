<?php

namespace App\Repositories;

use App\Models\Category;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class CategoryRepository
{
    protected array $allowedSorts = [
        'name', 'slug', 'sort_order', 'featured',
        'active', 'created_at', 'updated_at',
    ];

    public function query(): Builder
    {
        return Category::query()
            ->where('tenant_id', currentTenant()->id)
            ->with($this->defaultEagerLoads());
    }

    protected function defaultEagerLoads(): array
    {
        return ['parent', 'children'];
    }

    public function withCoursesCount(Builder $query): Builder
    {
        return $query->withCount('courses');
    }

    public function list(array $params = []): LengthAwarePaginator
    {
        $query = $this->query();

        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->applyStatusFilter($query, $params['status'] ?? null);
        $query = $this->applyFeaturedFilter($query, $params['featured'] ?? null);
        $query = $this->applyParentFilter($query, $params['parent_id'] ?? null);
        $query = $this->applyHasCoursesFilter($query, $params['has_courses'] ?? null);
        $query = $this->applyDateRangeFilter($query, $params['date_from'] ?? null, $params['date_to'] ?? null);
        $query = $this->applySort($query, $params['sort'] ?? null, $params['sort_dir'] ?? null);
        $query = $this->withCoursesCount($query);

        return $query->paginate((int) ($params['per_page'] ?? 50));
    }

    public function listAll(array $params = []): Collection
    {
        $query = $this->query();
        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->withCoursesCount($query);

        return $query->get();
    }

    public function listTree(): Collection
    {
        return $this->query()
            ->whereNull('parent_id')
            ->with(['children' => fn (HasMany $q) => $q->where('tenant_id', currentTenant()->id)->withCount('courses')])
            ->withCount('courses')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    public function findById(int $id): ?Category
    {
        return $this->query()->where('id', $id)->first();
    }

    public function findByIdOrFail(int $id): Category
    {
        return $this->query()->where('id', $id)->firstOrFail();
    }

    public function create(array $data): Category
    {
        $data['tenant_id'] = currentTenant()->id;
        $category = Category::create($data);
        $category->load($this->defaultEagerLoads());
        return $category;
    }

    public function update(Category $category, array $data): Category
    {
        $category->fill(collect($data)->only($category->getFillable())->all())->save();
        return $category->refresh()->load($this->defaultEagerLoads());
    }

    public function delete(Category $category): bool
    {
        return (bool) $category->delete();
    }

    public function restore(int $id): ?Category
    {
        $category = Category::onlyTrashed()
            ->where('tenant_id', currentTenant()->id)
            ->where('id', $id)
            ->first();

        if ($category) {
            $category->restore();
            return $category->load($this->defaultEagerLoads());
        }

        return null;
    }

    public function forceDelete(int $id): bool
    {
        $category = Category::onlyTrashed()
            ->where('tenant_id', currentTenant()->id)
            ->where('id', $id)
            ->first();

        if ($category) {
            return (bool) $category->forceDelete();
        }

        return false;
    }

    public function countTotal(): int
    {
        return Category::query()->where('tenant_id', currentTenant()->id)->count();
    }

    public function countActive(): int
    {
        return Category::query()->where('tenant_id', currentTenant()->id)->where('active', true)->count();
    }

    public function countInactive(): int
    {
        return Category::query()->where('tenant_id', currentTenant()->id)->where('active', false)->count();
    }

    public function countFeatured(): int
    {
        return Category::query()->where('tenant_id', currentTenant()->id)->where('featured', true)->count();
    }

    public function countParents(): int
    {
        return Category::query()->where('tenant_id', currentTenant()->id)->whereNull('parent_id')->count();
    }

    public function countChildren(): int
    {
        return Category::query()->where('tenant_id', currentTenant()->id)->whereNotNull('parent_id')->count();
    }

    public function countEmpty(): int
    {
        return Category::query()
            ->where('tenant_id', currentTenant()->id)
            ->whereDoesntHave('courses')
            ->count();
    }

    public function sumCoursesCount(): int
    {
        return Category::query()
            ->where('tenant_id', currentTenant()->id)
            ->withCount('courses')
            ->get()
            ->sum('courses_count');
    }

    protected function applySearch(Builder $query, ?string $search): Builder
    {
        if (! $search) {
            return $query;
        }

        $search = '%' . $search . '%';
        return $query->where(function (Builder $q) use ($search): void {
            $q->where('name', 'like', $search)
                ->orWhere('slug', 'like', $search)
                ->orWhere('description', 'like', $search);
        });
    }

    protected function applyStatusFilter(Builder $query, ?string $status): Builder
    {
        if (! $status || $status === 'all') {
            return $query;
        }
        return $query->where('active', $status === 'active');
    }

    protected function applyFeaturedFilter(Builder $query, $featured): Builder
    {
        if ($featured === null || $featured === 'all') {
            return $query;
        }
        return $query->where('featured', filter_var($featured, FILTER_VALIDATE_BOOLEAN));
    }

    protected function applyParentFilter(Builder $query, $parentId): Builder
    {
        if ($parentId === null || $parentId === 'all') {
            return $query;
        }
        if ($parentId === 'none') {
            return $query->whereNull('parent_id');
        }
        if ($parentId === 'has') {
            return $query->whereNotNull('parent_id');
        }
        return $query->where('parent_id', (int) $parentId);
    }

    protected function applyHasCoursesFilter(Builder $query, $hasCourses): Builder
    {
        if ($hasCourses === null || $hasCourses === 'all') {
            return $query;
        }
        if (filter_var($hasCourses, FILTER_VALIDATE_BOOLEAN)) {
            return $query->whereHas('courses');
        }
        return $query->whereDoesntHave('courses');
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
        $sort = in_array($sort, $this->allowedSorts, true) ? $sort : 'sort_order';
        $dir = $dir === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sort, $dir)->orderBy('name');
    }
}
