<?php

namespace App\Repositories;

use App\Models\QuestionCategory;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class QuestionCategoryRepository
{
    protected array $allowedSorts = ['name', 'sort_order', 'created_at', 'updated_at'];

    public function query(): Builder
    {
        return QuestionCategory::query()
            ->where('tenant_id', currentTenant()->id);
    }

    public function list(array $params = []): LengthAwarePaginator
    {
        $query = $this->query();

        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->applyStatusFilter($query, $params['status'] ?? null);
        $query = $this->applyParentFilter($query, $params['parent_id'] ?? null);
        $query = $this->applySort($query, $params['sort'] ?? null, $params['sort_dir'] ?? null);

        return $query->paginate((int) ($params['per_page'] ?? 50));
    }

    public function listAll(array $params = []): Collection
    {
        $query = $this->query();

        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->applyStatusFilter($query, $params['status'] ?? null);

        return $query->orderBy('sort_order')->orderBy('name')->get();
    }

    public function tree(): Collection
    {
        return $this->query()
            ->where('status', '!=', 'archived')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    public function findByIdOrFail(int $id): QuestionCategory
    {
        return $this->query()->where('id', $id)->firstOrFail();
    }

    public function create(array $data): QuestionCategory
    {
        $data['tenant_id'] = currentTenant()->id;

        return QuestionCategory::create($data);
    }

    public function update(QuestionCategory $category, array $data): QuestionCategory
    {
        $category->fill(collect($data)->only($category->getFillable())->all())->save();

        return $category->refresh();
    }

    public function delete(QuestionCategory $category): bool
    {
        return (bool) $category->delete();
    }

    public function restore(int $id): ?QuestionCategory
    {
        $category = QuestionCategory::query()
            ->withTrashed()
            ->where('tenant_id', currentTenant()->id)
            ->where('id', $id)
            ->first();

        if ($category) {
            $category->restore();
            $category->forceFill(['status' => 'published'])->save();

            return $category->refresh();
        }

        return null;
    }

    public function countByStatus(string $status): int
    {
        return QuestionCategory::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('status', $status)
            ->count();
    }

    protected function applySearch(Builder $query, ?string $search): Builder
    {
        if (! $search) {
            return $query;
        }

        $search = '%' . $search . '%';

        return $query->where(function (Builder $q) use ($search): void {
            $q->where('name', 'like', $search)
                ->orWhere('description', 'like', $search);
        });
    }

    protected function applyStatusFilter(Builder $query, ?string $status): Builder
    {
        if (! $status || $status === 'all') {
            return $query;
        }

        if ($status === 'archived') {
            return $query->where('status', 'archived');
        }

        return $query->where('status', $status);
    }

    protected function applyParentFilter(Builder $query, $parentId): Builder
    {
        if ($parentId === null || $parentId === 'all') {
            return $query;
        }

        if ($parentId === 'root') {
            return $query->whereNull('parent_id');
        }

        return $query->where('parent_id', $parentId);
    }

    protected function applySort(Builder $query, ?string $sort, ?string $dir): Builder
    {
        $sort = in_array($sort, $this->allowedSorts, true) ? $sort : 'sort_order';
        $dir = $dir === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sort, $dir);
    }
}
