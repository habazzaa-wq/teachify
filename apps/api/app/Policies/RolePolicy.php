<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'roles.view');
    }

    public function view(User $user, Role $role): bool
    {
        return $role->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'roles.view');
    }

    public function create(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'roles.assign');
    }

    public function update(User $user, Role $role): bool
    {
        return $role->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'roles.assign');
    }

    public function delete(User $user, Role $role): bool
    {
        return $role->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'roles.assign');
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
