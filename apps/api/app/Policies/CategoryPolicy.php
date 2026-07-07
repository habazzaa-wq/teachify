<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;

class CategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'categories.view');
    }

    public function view(User $user, Category $category): bool
    {
        return $category->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'categories.view');
    }

    public function create(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'categories.create');
    }

    public function update(User $user, Category $category): bool
    {
        return $category->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'categories.update');
    }

    public function delete(User $user, Category $category): bool
    {
        return $category->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'categories.delete');
    }

    public function restore(User $user, Category $category): bool
    {
        return $category->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'categories.restore');
    }

    public function feature(User $user, Category $category): bool
    {
        return $category->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'categories.feature');
    }

    public function activate(User $user, Category $category): bool
    {
        return $category->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'categories.activate');
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
