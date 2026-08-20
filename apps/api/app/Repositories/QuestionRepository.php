<?php

namespace App\Repositories;

use App\Models\Question;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class QuestionRepository
{
    protected array $allowedSorts = [
        'title', 'type', 'difficulty', 'status', 'visibility',
        'points', 'estimated_time', 'created_at', 'updated_at', 'question_format',
    ];

    public function query(): Builder
    {
        return Question::query()
            ->where('tenant_id', currentTenant()->id);
    }

    public function list(array $params = []): LengthAwarePaginator
    {
        $query = $this->query();

        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->applyTypeFilter($query, $params['type'] ?? null);
        $query = $this->applyDifficultyFilter($query, $params['difficulty'] ?? null);
        $query = $this->applyStatusFilter($query, $params['status'] ?? null);
        $query = $this->applyVisibilityFilter($query, $params['visibility'] ?? null);
        $query = $this->applyCategoryFilter($query, $params['category_id'] ?? null);
        $query = $this->applyBankFilter($query, $params['bank_id'] ?? null);
        $query = $this->applyTagsFilter($query, $params['tags'] ?? null);
        $query = $this->applyFavoritesFilter($query, $params['favorites'] ?? null);
        $query = $this->applySort($query, $params['sort'] ?? null, $params['sort_dir'] ?? null);

        return $query->with('scan')->paginate((int) ($params['per_page'] ?? 25));
    }

    public function listAll(array $params = []): Collection
    {
        $query = $this->query();

        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->applyTypeFilter($query, $params['type'] ?? null);
        $query = $this->applyStatusFilter($query, $params['status'] ?? null);

        return $query->orderBy('title')->get();
    }

    public function findById(int $id): ?Question
    {
        return $this->query()->where('id', $id)->first();
    }

    public function findByIdOrFail(int $id): Question
    {
        return $this->query()->where('id', $id)->firstOrFail();
    }

    public function findByIds(array $ids): Collection
    {
        return $this->query()->with('scan')->whereIn('id', $ids)->get();
    }

    public function create(array $data): Question
    {
        $data['tenant_id'] = currentTenant()->id;

        return Question::create($data);
    }

    public function update(Question $question, array $data): Question
    {
        $question->fill(collect($data)->only($question->getFillable())->all())->save();

        return $question->refresh();
    }

    public function delete(Question $question): bool
    {
        return (bool) $question->delete();
    }

    public function restore(int $id): ?Question
    {
        $question = Question::query()
            ->withTrashed()
            ->where('tenant_id', currentTenant()->id)
            ->where('id', $id)
            ->first();

        if ($question) {
            $question->restore();
            $question->forceFill(['status' => 'published'])->save();

            return $question->refresh();
        }

        return null;
    }

    public function countByStatus(string $status): int
    {
        return Question::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('status', $status)
            ->count();
    }

    public function countByType(): array
    {
        return Question::query()
            ->where('tenant_id', currentTenant()->id)
            ->whereNull('deleted_at')
            ->selectRaw('type, count(*) as total')
            ->groupBy('type')
            ->pluck('total', 'type')
            ->all();
    }

    protected function applySearch(Builder $query, ?string $search): Builder
    {
        if (! $search) {
            return $query;
        }

        $search = '%' . $search . '%';

        return $query->where(function (Builder $q) use ($search): void {
            $q->where('title', 'like', $search)
                ->orWhere('description', 'like', $search)
                ->orWhere('slug', 'like', $search);
        });
    }

    protected function applyTypeFilter(Builder $query, ?string $type): Builder
    {
        if (! $type || $type === 'all') {
            return $query;
        }

        return $query->where('type', $type);
    }

    protected function applyDifficultyFilter(Builder $query, ?string $difficulty): Builder
    {
        if (! $difficulty || $difficulty === 'all') {
            return $query;
        }

        return $query->where('difficulty', $difficulty);
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

    protected function applyBankFilter(Builder $query, $bankId): Builder
    {
        if (! $bankId || $bankId === 'all') {
            return $query;
        }

        if ($bankId === 'none') {
            return $query->whereNull('bank_id');
        }

        return $query->where('bank_id', $bankId);
    }

    protected function applyTagsFilter(Builder $query, $tags): Builder
    {
        if (empty($tags)) {
            return $query;
        }

        $tags = is_array($tags) ? $tags : explode(',', (string) $tags);

        foreach ($tags as $tag) {
            $query->whereJsonContains('tags', $tag);
        }

        return $query;
    }

    protected function applyFavoritesFilter(Builder $query, $favorites): Builder
    {
        if ($favorites === null || $favorites === 'all' || $favorites === false) {
            return $query;
        }

        return $query->where('metadata->favorite', true);
    }

    protected function applySort(Builder $query, ?string $sort, ?string $dir): Builder
    {
        $sort = in_array($sort, $this->allowedSorts, true) ? $sort : 'created_at';
        $dir = $dir === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sort, $dir);
    }
}
