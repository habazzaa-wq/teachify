<?php

namespace App\Policies;

use App\Models\Exam;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;

class ExamPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'exams.view');
    }

    public function view(User $user, Exam $exam): bool
    {
        if ($exam->tenant_id !== currentTenant()->id) {
            return false;
        }

        if ($this->isTenantOperator($user, currentTenant()) || $this->isOwner($user, $exam)) {
            return true;
        }

        return $exam->status === 'published'
            && in_array($exam->visibility, ['public', 'enrolled_only'], true)
            && $this->auth()->hasPermission($user, currentTenant(), 'exams.view');
    }

    public function create(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'exams.create');
    }

    public function update(User $user, Exam $exam): bool
    {
        if ($exam->tenant_id !== currentTenant()->id) {
            return false;
        }

        if ($this->isTenantOperator($user, currentTenant())) {
            return $this->auth()->hasPermission($user, currentTenant(), 'exams.update');
        }

        return $this->isOwner($user, $exam)
            && $this->auth()->hasPermission($user, currentTenant(), 'exams.update');
    }

    public function publish(User $user, Exam $exam): bool
    {
        return $exam->tenant_id === currentTenant()->id
            && $this->isTenantOperator($user, currentTenant())
            && $this->auth()->hasPermission($user, currentTenant(), 'exams.publish');
    }

    public function delete(User $user, Exam $exam): bool
    {
        return $exam->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'exams.delete');
    }

    public function restore(User $user, Exam $exam): bool
    {
        return $this->update($user, $exam);
    }

    private function isTenantOperator(User $user, Tenant $tenant): bool
    {
        return $this->auth()->hasRole($user, $tenant, 'tenant_owner')
            || $this->auth()->hasRole($user, $tenant, 'admin');
    }

    private function isOwner(User $user, Exam $exam): bool
    {
        $membership = $this->auth()->membershipFor($user, currentTenant());

        if (! $membership || $membership->status !== 'active') {
            return false;
        }

        return $exam->created_by_tenant_user_id === $membership->id;
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
