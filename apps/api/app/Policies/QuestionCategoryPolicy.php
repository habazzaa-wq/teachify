<?php

namespace App\Policies;

use App\Models\QuestionCategory;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;

class QuestionCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'questions.view');
    }

    public function view(User $user, QuestionCategory $category): bool
    {
        return $category->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'questions.view');
    }

    public function create(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'questions.create');
    }

    public function update(User $user, QuestionCategory $category): bool
    {
        return $category->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'questions.update');
    }

    public function delete(User $user, QuestionCategory $category): bool
    {
        return $category->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'questions.delete');
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
