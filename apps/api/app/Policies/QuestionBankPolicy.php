<?php

namespace App\Policies;

use App\Models\QuestionBank;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;

class QuestionBankPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'exams.view');
    }

    public function view(User $user, QuestionBank $bank): bool
    {
        return $bank->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'exams.view');
    }

    public function create(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'exams.create');
    }

    public function update(User $user, QuestionBank $bank): bool
    {
        return $bank->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'exams.update');
    }

    public function delete(User $user, QuestionBank $bank): bool
    {
        return $bank->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'exams.delete');
    }

    public function restore(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'exams.update');
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
