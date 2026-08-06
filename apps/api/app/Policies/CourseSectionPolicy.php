<?php

namespace App\Policies;

use App\Models\CourseSection;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;

class CourseSectionPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'sections.view');
    }

    public function view(User $user, CourseSection $section): bool
    {
        if ($section->tenant_id !== currentTenant()->id) {
            return false;
        }

        return $this->auth()->hasPermission($user, currentTenant(), 'sections.view');
    }

    public function create(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'sections.create');
    }

    public function update(User $user, CourseSection $section): bool
    {
        return $section->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'sections.update');
    }

    public function delete(User $user, CourseSection $section): bool
    {
        return $section->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'sections.delete');
    }

    public function publish(User $user, CourseSection $section): bool
    {
        return $section->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'sections.publish');
    }

    public function feature(User $user, CourseSection $section): bool
    {
        return $section->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'sections.feature');
    }

    public function reorder(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'sections.reorder');
    }

    public function restore(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'sections.delete');
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
