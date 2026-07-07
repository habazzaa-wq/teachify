<?php

namespace App\Services\Authorization;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

class TenantAuthorizationService
{
    public function __construct(
        private readonly AuthorizationService $authorization,
    ) {}

    public function membershipFor(User $user, Tenant $tenant): ?TenantUser
    {
        return TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->first();
    }

    public function hasActiveMembership(User $user, Tenant $tenant): bool
    {
        return TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->exists();
    }

    public function hasRole(User $user, Tenant $tenant, string $roleSlug): bool
    {
        return $this->authorization->hasRole($user, $roleSlug, $tenant);
    }

    public function hasPermission(User $user, Tenant $tenant, string $permissionSlug): bool
    {
        return $this->authorization->hasPermission($user, $permissionSlug, $tenant);
    }

    public function hasAnyPermission(User $user, Tenant $tenant, array $permissionSlugs): bool
    {
        return $this->authorization->hasAnyPermission($user, $permissionSlugs, $tenant);
    }

    public function hasAllPermissions(User $user, Tenant $tenant, array $permissionSlugs): bool
    {
        return $this->authorization->hasAllPermissions($user, $permissionSlugs, $tenant);
    }

    public function hasAnyRole(User $user, Tenant $tenant, array $roleSlugs): bool
    {
        return $this->authorization->hasAnyRole($user, $roleSlugs, $tenant);
    }

    /**
     * @throws AuthorizationException
     */
    public function authorize(User $user, Tenant $tenant, string $permissionSlug): void
    {
        if (! $this->hasPermission($user, $tenant, $permissionSlug)) {
            throw new AuthorizationException('This action is unauthorized.');
        }
    }
}
