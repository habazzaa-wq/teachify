<?php

namespace App\Repositories;

use App\Models\TenantUser;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class TenantUserRepository
{
    protected array $allowedSorts = [
        'joined_at', 'last_accessed_at', 'last_login_at', 'status',
        'department', 'job_title', 'locale', 'created_at', 'updated_at',
    ];

    protected array $allowedIncludes = ['user', 'roles', 'roles.permissions', 'createdBy', 'updatedBy'];

    public function query(): Builder
    {
        return TenantUser::query()
            ->where('tenant_id', currentTenant()->id)
            ->with($this->defaultEagerLoads());
    }

    protected function defaultEagerLoads(): array
    {
        return ['user', 'roles'];
    }

    public function list(array $params = []): LengthAwarePaginator
    {
        $query = $this->query();

        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->applyStatusFilter($query, $params['status'] ?? null);
        $query = $this->applyRoleFilter($query, $params['role_id'] ?? null);
        $query = $this->applyDepartmentFilter($query, $params['department'] ?? null);
        $query = $this->applyDateFilter($query, $params['date_from'] ?? null, $params['date_to'] ?? null, 'created_at');
        $query = $this->applyLastLoginFilter($query, $params['last_login'] ?? null);
        $query = $this->applySort($query, $params['sort'] ?? null, $params['sort_dir'] ?? null);

        return $query->paginate((int) ($params['per_page'] ?? 25));
    }

    public function listAll(array $params = []): Collection
    {
        $query = $this->query();
        $query = $this->applySearch($query, $params['search'] ?? null);
        $query = $this->applyStatusFilter($query, $params['status'] ?? null);

        return $query->get();
    }

    public function findById(int $id): ?TenantUser
    {
        return $this->query()->where('id', $id)->first();
    }

    public function findByIdOrFail(int $id): TenantUser
    {
        return $this->query()->where('id', $id)->firstOrFail();
    }

    public function findByUserId(int $userId): ?TenantUser
    {
        return $this->query()->where('user_id', $userId)->first();
    }

    public function create(array $data): TenantUser
    {
        $data['tenant_id'] = currentTenant()->id;
        $tenantUser = TenantUser::create($data);
        $tenantUser->load($this->defaultEagerLoads());
        return $tenantUser;
    }

    public function update(TenantUser $tenantUser, array $data): TenantUser
    {
        $tenantUser->fill(collect($data)->only($tenantUser->getFillable())->all())->save();
        return $tenantUser->refresh()->load($this->defaultEagerLoads());
    }

    public function delete(TenantUser $tenantUser): bool
    {
        return (bool) $tenantUser->delete();
    }

    public function restore(int $id): ?TenantUser
    {
        $tenantUser = TenantUser::onlyTrashed()
            ->where('tenant_id', currentTenant()->id)
            ->where('id', $id)
            ->first();

        if ($tenantUser) {
            $tenantUser->restore();
            return $tenantUser->load($this->defaultEagerLoads());
        }

        return null;
    }

    public function bulkDelete(array $ids): int
    {
        return TenantUser::query()
            ->where('tenant_id', currentTenant()->id)
            ->whereIn('id', $ids)
            ->delete();
    }

    public function bulkRestore(array $ids): int
    {
        return TenantUser::onlyTrashed()
            ->where('tenant_id', currentTenant()->id)
            ->whereIn('id', $ids)
            ->restore();
    }

    public function bulkUpdateStatus(array $ids, string $status): int
    {
        return TenantUser::query()
            ->where('tenant_id', currentTenant()->id)
            ->whereIn('id', $ids)
            ->where('id', '!=', currentTenantUser()?->id)
            ->update(['status' => $status]);
    }

    public function updateStatus(TenantUser $tenantUser, string $status): TenantUser
    {
        $tenantUser->forceFill(['status' => $status])->save();
        return $tenantUser->refresh()->load($this->defaultEagerLoads());
    }

    public function countByStatus(string $status): int
    {
        return TenantUser::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('status', $status)
            ->count();
    }

    public function countNewThisMonth(): int
    {
        return TenantUser::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();
    }

    public function countDepartmentDistinct(): int
    {
        return TenantUser::query()
            ->where('tenant_id', currentTenant()->id)
            ->whereNotNull('department')
            ->distinct('department')
            ->count('department');
    }

    public function countWithTwoFactor(): int
    {
        return 0;
    }

    public function countPendingInvites(): int
    {
        return TenantUser::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('status', 'pending')
            ->count();
    }

    protected function applySearch(Builder $query, ?string $search): Builder
    {
        if (! $search) {
            return $query;
        }

        $search = '%' . $search . '%';
        return $query->where(function (Builder $q) use ($search): void {
            $q->whereHas('user', function (Builder $uq) use ($search): void {
                $uq->where('name', 'like', $search)
                    ->orWhere('email', 'like', $search);
            })
                ->orWhere('phone', 'like', $search)
                ->orWhere('job_title', 'like', $search)
                ->orWhere('department', 'like', $search);
        });
    }

    protected function applyStatusFilter(Builder $query, ?string $status): Builder
    {
        if (! $status || $status === 'all') {
            return $query;
        }
        return $query->where('status', $status);
    }

    protected function applyRoleFilter(Builder $query, $roleId): Builder
    {
        if (! $roleId) {
            return $query;
        }
        return $query->whereHas('roles', fn (Builder $q) => $q->where('roles.id', $roleId));
    }

    protected function applyDepartmentFilter(Builder $query, ?string $department): Builder
    {
        if (! $department || $department === 'all') {
            return $query;
        }
        return $query->where('department', $department);
    }

    protected function applyDateFilter(Builder $query, ?string $from, ?string $to, string $column): Builder
    {
        if ($from) {
            $query->where($column, '>=', $from);
        }
        if ($to) {
            $query->where($column, '<=', $to);
        }
        return $query;
    }

    protected function applyLastLoginFilter(Builder $query, ?string $lastLogin): Builder
    {
        if (! $lastLogin || $lastLogin === 'all') {
            return $query;
        }

        return match ($lastLogin) {
            'today' => $query->whereDate('last_login_at', today()),
            'week' => $query->where('last_login_at', '>=', now()->subWeek()),
            'month' => $query->where('last_login_at', '>=', now()->subMonth()),
            'older' => $query->where(function (Builder $q): void {
                $q->where('last_login_at', '<', now()->subMonth())
                    ->orWhereNull('last_login_at');
            }),
            default => $query,
        };
    }

    protected function applySort(Builder $query, ?string $sort, ?string $dir): Builder
    {
        $sort = in_array($sort, $this->allowedSorts, true) ? $sort : 'created_at';
        $dir = $dir === 'asc' ? 'asc' : 'desc';

        if (in_array($sort, ['name', 'email'], true)) {
            return $query->orderBy(
                User::select($sort)
                    ->whereColumn('users.id', 'tenant_users.user_id')
                    ->limit(1),
                $dir
            );
        }

        return $query->orderBy($sort, $dir);
    }
}
