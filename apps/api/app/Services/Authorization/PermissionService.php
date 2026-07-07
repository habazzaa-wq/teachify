<?php

namespace App\Services\Authorization;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class PermissionService
{
    public function getUserPermissions(User $user, Tenant $tenant): array
    {
        return Cache::remember(
            $this->permissionCacheKey($tenant->id, $user->id),
            3600,
            function () use ($user, $tenant) {
                return TenantUser::query()
                    ->where('tenant_users.tenant_id', $tenant->id)
                    ->where('tenant_users.user_id', $user->id)
                    ->where('tenant_users.status', 'active')
                    ->whereHas('roles', function ($query) use ($tenant) {
                        $query->where('roles.tenant_id', $tenant->id);
                    })
                    ->with('roles.permissions')
                    ->get()
                    ->flatMap(fn (TenantUser $tu) => $tu->roles->flatMap->permissions)
                    ->unique('id')
                    ->pluck('slug')
                    ->values()
                    ->all();
            }
        );
    }

    public function getUserRoles(User $user, Tenant $tenant): array
    {
        return Cache::remember(
            $this->roleCacheKey($tenant->id, $user->id),
            3600,
            function () use ($user, $tenant) {
                return TenantUser::query()
                    ->where('tenant_users.tenant_id', $tenant->id)
                    ->where('tenant_users.user_id', $user->id)
                    ->where('tenant_users.status', 'active')
                    ->whereHas('roles', function ($query) use ($tenant) {
                        $query->where('roles.tenant_id', $tenant->id);
                    })
                    ->with('roles')
                    ->get()
                    ->flatMap(fn (TenantUser $tu) => $tu->roles)
                    ->unique('id')
                    ->pluck('slug')
                    ->values()
                    ->all();
            }
        );
    }

    public function clearUserCache(User $user, Tenant $tenant): void
    {
        Cache::forget($this->permissionCacheKey($tenant->id, $user->id));
        Cache::forget($this->roleCacheKey($tenant->id, $user->id));
    }

    public function clearTenantCache(Tenant $tenant): void
    {
        $prefix = "tenant.{$tenant->id}.user.";
        $keys = Cache::get("{$prefix}*", []);

        foreach (TenantUser::query()->where('tenant_id', $tenant->id)->pluck('user_id') as $userId) {
            Cache::forget($this->permissionCacheKey($tenant->id, $userId));
            Cache::forget($this->roleCacheKey($tenant->id, $userId));
        }
    }

    public function clearAllUserCaches(int $tenantId): void
    {
        $userIds = TenantUser::query()
            ->where('tenant_id', $tenantId)
            ->pluck('user_id');

        foreach ($userIds as $userId) {
            Cache::forget($this->permissionCacheKey($tenantId, $userId));
            Cache::forget($this->roleCacheKey($tenantId, $userId));
        }
    }

    public function permissionCacheKey(int $tenantId, int $userId): string
    {
        return "tenant.{$tenantId}.user.{$userId}.permissions";
    }

    public function roleCacheKey(int $tenantId, int $userId): string
    {
        return "tenant.{$tenantId}.user.{$userId}.roles";
    }
}
