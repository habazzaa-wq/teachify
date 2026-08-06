<?php

namespace App\Repositories;

use App\Models\QuestionBank;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class QuestionBankRepository
{
    protected array $allowedSorts = ['name', 'created_at', 'updated_at'];

    public function query(): Builder
    {
        return QuestionBank::query()
            ->where('tenant_id', currentTenant()->id);
    }

    public function list(array $params = []): LengthAwarePaginator
    {
        $query = $this->query();

        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->applyStatusFilter($query, $params['status'] ?? null);
        $query = $this->applyVisibilityFilter($query, $params['visibility'] ?? null);
        $query = $this->applyCategoryFilter($query, $params['category_id'] ?? null);
        $query = $this->applySort($query, $params['sort'] ?? null, $params['sort_dir'] ?? null);

        return $query->paginate((int) ($params['per_page'] ?? 25));
    }

    public function listAll(array $params = []): Collection
    {
        $query = $this->query();

        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->applyStatusFilter($query, $params['status'] ?? null);

        return $query->orderBy('name')->get();
    }

    public function findByIdOrFail(int $id): QuestionBank
    {
        return $this->query()->where('id', $id)->firstOrFail();
    }

    public function create(array $data): QuestionBank
    {
        $data['tenant_id'] = currentTenant()->id;

        return QuestionBank::create($data);
    }

    public function update(QuestionBank $bank, array $data): QuestionBank
    {
        $bank->fill(collect($data)->only($bank->getFillable())->all())->save();

        return $bank->refresh();
    }

    public function delete(QuestionBank $bank): bool
    {
        return (bool) $bank->delete();
    }

    public function restore(int $id): ?QuestionBank
    {
        $bank = QuestionBank::query()
            ->withTrashed()
            ->where('tenant_id', currentTenant()->id)
            ->where('id', $id)
            ->first();

        if ($bank) {
            $bank->restore();
            $bank->forceFill(['status' => 'published'])->save();

            return $bank->refresh();
        }

        return null;
    }

    public function countByStatus(string $status): int
    {
        return QuestionBank::query()
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

    protected function applyVisibilityFilter(Builder $query, ?string $visibility): Builder
    {
        if (! $visibility || $visibility === 'all') {
            return $query;
        }

        return $query->where('visibility', $visibility);
    }

    protected function applyCategoryFilter(Builder $query, $categoryId): Builder
    {
        if (! $categoryId || $categoryId === 'all') {
            return $query;
        }

        return $query->where('category_id', $categoryId);
    }

    protected function applySort(Builder $query, ?string $sort, ?string $dir): Builder
    {
        $sort = in_array($sort, $this->allowedSorts, true) ? $sort : 'created_at';
        $dir = $dir === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sort, $dir);
    }
}
