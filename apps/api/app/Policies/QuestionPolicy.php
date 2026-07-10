<?php

namespace App\Policies;

use App\Models\Question;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;

class QuestionPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'questions.view');
    }

    public function view(User $user, Question $question): bool
    {
        if ($question->tenant_id !== currentTenant()->id) {
            return false;
        }

        if ($this->isTenantOperator($user, currentTenant()) || $this->isOwner($user, $question)) {
            return true;
        }

        return $question->status === 'published'
            && $question->visibility === 'public'
            && $this->auth()->hasPermission($user, currentTenant(), 'questions.view');
    }

    public function create(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'questions.create');
    }

    public function update(User $user, Question $question): bool
    {
        if ($question->tenant_id !== currentTenant()->id) {
            return false;
        }

        if ($this->isTenantOperator($user, currentTenant())) {
            return $this->auth()->hasPermission($user, currentTenant(), 'questions.update');
        }

        return $this->isOwner($user, $question)
            && $this->auth()->hasPermission($user, currentTenant(), 'questions.update');
    }

    public function publish(User $user, Question $question): bool
    {
        return $question->tenant_id === currentTenant()->id
            && $this->isTenantOperator($user, currentTenant())
            && $this->auth()->hasPermission($user, currentTenant(), 'questions.publish');
    }

    public function delete(User $user, Question $question): bool
    {
        return $question->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'questions.delete');
    }

    public function restore(User $user, Question $question): bool
    {
        return $this->update($user, $question);
    }

    private function isTenantOperator(User $user, Tenant $tenant): bool
    {
        return $this->auth()->hasRole($user, $tenant, 'tenant_owner')
            || $this->auth()->hasRole($user, $tenant, 'admin');
    }

    private function isOwner(User $user, Question $question): bool
    {
        $membership = $this->auth()->membershipFor($user, currentTenant());

        if (! $membership || $membership->status !== 'active') {
            return false;
        }

        return $question->created_by_tenant_user_id === $membership->id;
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
