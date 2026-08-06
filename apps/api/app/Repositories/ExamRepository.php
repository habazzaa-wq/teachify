<?php

namespace App\Repositories;

use App\Models\Exam;
use App\Models\ExamAttempt;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class ExamRepository
{
    protected array $allowedSorts = [
        'title', 'status', 'visibility', 'category', 'language',
        'duration', 'passing_score', 'question_count', 'created_at', 'updated_at',
    ];

    public function query(): Builder
    {
        return Exam::query()
            ->where('tenant_id', currentTenant()->id);
    }

    public function list(array $params = []): LengthAwarePaginator
    {
        $query = $this->query();

        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->applyStatusFilter($query, $params['status'] ?? null);
        $query = $this->applyVisibilityFilter($query, $params['visibility'] ?? null);
        $query = $this->applyCategoryFilter($query, $params['category'] ?? null);
        $query = $this->applyPinnedFilter($query, $params['pinned'] ?? null);
        $query = $this->applyFeaturedFilter($query, $params['featured'] ?? null);
        $query = $this->applyFavoritesFilter($query, $params['favorites'] ?? null);
        $query = $this->applyRecentFilter($query, $params['recent'] ?? null);
        $query = $this->withCounts($query);
        $query = $this->applySort($query, $params['sort'] ?? null, $params['sort_dir'] ?? null);

        return $query->paginate((int) ($params['per_page'] ?? 25));
    }

    public function listAll(array $params = []): Collection
    {
        $query = $this->query();

        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->applyStatusFilter($query, $params['status'] ?? null);

        return $query->orderBy('title')->get();
    }

    public function findById(int $id): ?Exam
    {
        return $this->query()->where('id', $id)->first();
    }

    public function findByIdOrFail(int $id): Exam
    {
        return $this->query()->where('id', $id)->firstOrFail();
    }

    public function findByIds(array $ids): Collection
    {
        return $this->query()->whereIn('id', $ids)->get();
    }

    public function create(array $data): Exam
    {
        $data['tenant_id'] = currentTenant()->id;

        return Exam::create($data);
    }

    public function update(Exam $exam, array $data): Exam
    {
        $exam->fill(collect($data)->only($exam->getFillable())->all())->save();

        return $exam->refresh();
    }

    public function delete(Exam $exam): bool
    {
        return (bool) $exam->delete();
    }

    public function restore(int $id): ?Exam
    {
        $exam = Exam::query()
            ->withTrashed()
            ->where('tenant_id', currentTenant()->id)
            ->where('id', $id)
            ->first();

        if ($exam) {
            $exam->restore();
            $exam->forceFill([
                'status' => 'published',
                'archived_at' => null,
                'published_at' => now(),
            ])->save();

            return $exam->refresh();
        }

        return null;
    }

    public function recent(int $limit = 6): Collection
    {
        return $this->query()
            ->where('status', '!=', 'archived')
            ->orderBy('updated_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function pinned(): Collection
    {
        return $this->query()
            ->where('pinned', true)
            ->where('status', '!=', 'archived')
            ->orderBy('updated_at', 'desc')
            ->get();
    }

    public function favorites(): Collection
    {
        return $this->query()
            ->where('metadata->favorite', true)
            ->where('status', '!=', 'archived')
            ->orderBy('updated_at', 'desc')
            ->get();
    }

    public function favoritesCount(): int
    {
        return $this->query()
            ->where('metadata->favorite', true)
            ->where('status', '!=', 'archived')
            ->count();
    }

    public function featured(): Collection
    {
        return $this->query()
            ->where('featured', true)
            ->where('status', '!=', 'archived')
            ->orderBy('updated_at', 'desc')
            ->get();
    }

    public function countByStatus(string $status): int
    {
        return Exam::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('status', $status)
            ->count();
    }

    public function metricTotals(): array
    {
        $tenantId = currentTenant()->id;

        return [
            'total' => Exam::query()->where('tenant_id', $tenantId)->whereNull('deleted_at')->count(),
            'published' => Exam::query()->where('tenant_id', $tenantId)->where('status', 'published')->count(),
            'draft' => Exam::query()->where('tenant_id', $tenantId)->where('status', 'draft')->count(),
            'archived' => Exam::query()->where('tenant_id', $tenantId)->where('status', 'archived')->count(),
            'pinned' => $this->pinned()->count(),
            'featured' => $this->featured()->count(),
            'favorites' => $this->favoritesCount(),
            'questions' => \App\Models\Question::query()->where('tenant_id', $tenantId)->whereNull('deleted_at')->count(),
            'attempts' => ExamAttempt::query()->where('tenant_id', $tenantId)->count(),
        ];
    }

    protected function withCounts(Builder $query): Builder
    {
        return $query->withCount(['examQuestions', 'attempts']);
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

    protected function applyCategoryFilter(Builder $query, $category): Builder
    {
        if (! $category || $category === 'all') {
            return $query;
        }

        return $query->where('category', $category);
    }

    protected function applyPinnedFilter(Builder $query, $pinned): Builder
    {
        if ($pinned === null || $pinned === 'all' || $pinned === false) {
            return $query;
        }

        return $query->where('pinned', true);
    }

    protected function applyFeaturedFilter(Builder $query, $featured): Builder
    {
        if ($featured === null || $featured === 'all' || $featured === false) {
            return $query;
        }

        return $query->where('featured', true);
    }

    protected function applyFavoritesFilter(Builder $query, $favorites): Builder
    {
        if ($favorites === null || $favorites === 'all' || $favorites === false) {
            return $query;
        }

        return $query->where('metadata->favorite', true);
    }

    protected function applyRecentFilter(Builder $query, $recent): Builder
    {
        if ($recent === null || $recent === 'all' || $recent === false) {
            return $query;
        }

        return $query->where('status', '!=', 'archived')->orderBy('updated_at', 'desc');
    }

    protected function applySort(Builder $query, ?string $sort, ?string $dir): Builder
    {
        $sort = in_array($sort, $this->allowedSorts, true) ? $sort : 'updated_at';
        $dir = $dir === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sort, $dir);
    }
}
