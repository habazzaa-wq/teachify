<?php

namespace App\Policies;

use App\Models\Tag;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;

class TagPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'courses.view');
    }

    public function view(User $user, Tag $tag): bool
    {
        return $tag->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'courses.view');
    }

    public function create(User $user): bool
    {
        return $this->canManage($user);
    }

    public function update(User $user, Tag $tag): bool
    {
        return $tag->tenant_id === currentTenant()->id && $this->canManage($user);
    }

    public function delete(User $user, Tag $tag): bool
    {
        return $this->update($user, $tag);
    }

    private function canManage(User $user): bool
    {
        return $this->auth()->hasRole($user, currentTenant(), 'tenant_owner')
            || $this->auth()->hasRole($user, currentTenant(), 'admin');
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
