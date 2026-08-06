<?php

namespace App\Policies;

use App\Models\CourseModule;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;

class CourseModulePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'modules.view');
    }

    public function view(User $user, CourseModule $module): bool
    {
        if ($module->tenant_id !== currentTenant()->id) {
            return false;
        }

        return $this->auth()->hasPermission($user, currentTenant(), 'modules.view');
    }

    public function create(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'modules.create');
    }

    public function update(User $user, CourseModule $module): bool
    {
        return $module->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'modules.update');
    }

    public function delete(User $user, CourseModule $module): bool
    {
        return $module->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'modules.delete');
    }

    public function publish(User $user, CourseModule $module): bool
    {
        return $module->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'modules.publish');
    }

    public function archive(User $user, CourseModule $module): bool
    {
        return $module->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'modules.archive');
    }

    public function feature(User $user, CourseModule $module): bool
    {
        return $module->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'modules.feature');
    }

    public function reorder(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'modules.reorder');
    }

    public function restore(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'modules.delete');
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
