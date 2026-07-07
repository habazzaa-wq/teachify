<?php

namespace App\Services\Authorization;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

class AuthorizationService
{
    public function __construct(
        private readonly PermissionService $permissions,
    ) {}

    public function hasPermission(User $user, string $permissionSlug, ?Tenant $tenant = null): bool
    {
        $tenant = $tenant ?? currentTenant();

        return in_array(
            $permissionSlug,
            $this->permissions->getUserPermissions($user, $tenant),
            true
        );
    }

    public function hasAnyPermission(User $user, array $permissionSlugs, ?Tenant $tenant = null): bool
    {
        $tenant = $tenant ?? currentTenant();
        $userPermissions = $this->permissions->getUserPermissions($user, $tenant);

        foreach ($permissionSlugs as $slug) {
            if (in_array($slug, $userPermissions, true)) {
                return true;
            }
        }

        return false;
    }

    public function hasAllPermissions(User $user, array $permissionSlugs, ?Tenant $tenant = null): bool
    {
        $tenant = $tenant ?? currentTenant();
        $userPermissions = $this->permissions->getUserPermissions($user, $tenant);

        foreach ($permissionSlugs as $slug) {
            if (! in_array($slug, $userPermissions, true)) {
                return false;
            }
        }

        return true;
    }

    public function hasRole(User $user, string $roleSlug, ?Tenant $tenant = null): bool
    {
        $tenant = $tenant ?? currentTenant();

        return in_array(
            $roleSlug,
            $this->permissions->getUserRoles($user, $tenant),
            true
        );
    }

    public function hasAnyRole(User $user, array $roleSlugs, ?Tenant $tenant = null): bool
    {
        $tenant = $tenant ?? currentTenant();
        $userRoles = $this->permissions->getUserRoles($user, $tenant);

        foreach ($roleSlugs as $slug) {
            if (in_array($slug, $userRoles, true)) {
                return true;
            }
        }

        return false;
    }

    public function can(User $user, string $ability, ?Tenant $tenant = null): bool
    {
        return $this->hasPermission($user, $ability, $tenant);
    }

    public function cannot(User $user, string $ability, ?Tenant $tenant = null): bool
    {
        return ! $this->can($user, $ability, $tenant);
    }

    public function authorize(User $user, string $permissionSlug, ?Tenant $tenant = null): void
    {
        if (! $this->hasPermission($user, $permissionSlug, $tenant)) {
            throw new AuthorizationException('This action is unauthorized.');
        }
    }

    public function getUserPermissions(User $user, ?Tenant $tenant = null): array
    {
        $tenant = $tenant ?? currentTenant();

        return $this->permissions->getUserPermissions($user, $tenant);
    }

    public function getUserRoles(User $user, ?Tenant $tenant = null): array
    {
        $tenant = $tenant ?? currentTenant();

        return $this->permissions->getUserRoles($user, $tenant);
    }
}
