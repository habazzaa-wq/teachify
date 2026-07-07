<?php

namespace App\Policies;

use App\Models\TenantUser;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;

class TenantUserPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'users.view');
    }

    public function view(User $user, TenantUser $tenantUser): bool
    {
        return $tenantUser->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'users.view');
    }

    public function create(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'users.manage');
    }

    public function update(User $user, TenantUser $tenantUser): bool
    {
        return $tenantUser->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'users.manage');
    }

    public function delete(User $user, TenantUser $tenantUser): bool
    {
        return $tenantUser->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'users.manage');
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
