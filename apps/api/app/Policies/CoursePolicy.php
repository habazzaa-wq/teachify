<?php

namespace App\Policies;

use App\Models\Course;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;

class CoursePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'courses.view');
    }

    public function view(User $user, Course $course): bool
    {
        if ($course->tenant_id !== currentTenant()->id) {
            return false;
        }

        if ($this->isTenantOperator($user, currentTenant()) || $this->isAssignedInstructor($user, $course)) {
            return true;
        }

        return $course->status === 'published'
            && in_array($course->visibility, ['public', 'enrolled_only'], true)
            && $this->auth()->hasPermission($user, currentTenant(), 'courses.view');
    }

    public function create(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'courses.create');
    }

    public function update(User $user, Course $course): bool
    {
        if ($course->tenant_id !== currentTenant()->id) {
            return false;
        }

        if ($this->isTenantOperator($user, currentTenant())) {
            return $this->auth()->hasPermission($user, currentTenant(), 'courses.update');
        }

        return $this->isAssignedInstructor($user, $course)
            && $this->auth()->hasPermission($user, currentTenant(), 'courses.update');
    }

    public function publish(User $user, Course $course): bool
    {
        if ($course->tenant_id !== currentTenant()->id) {
            return false;
        }

        if ($this->isTenantOperator($user, currentTenant())) {
            return $this->auth()->hasPermission($user, currentTenant(), 'courses.publish');
        }

        return $this->isAssignedInstructor($user, $course)
            && $this->auth()->hasPermission($user, currentTenant(), 'courses.update');
    }

    public function delete(User $user, Course $course): bool
    {
        return $course->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'courses.delete');
    }

    public function archive(User $user, Course $course): bool
    {
        return $this->update($user, $course);
    }

    public function feature(User $user, Course $course): bool
    {
        return $course->tenant_id === currentTenant()->id
            && $this->isTenantOperator($user, currentTenant())
            && $this->auth()->hasPermission($user, currentTenant(), 'courses.feature');
    }

    public function assignInstructors(User $user, Course $course): bool
    {
        return $course->tenant_id === currentTenant()->id
            && $this->isTenantOperator($user, currentTenant())
            && $this->auth()->hasPermission($user, currentTenant(), 'courses.assign_instructors');
    }

    public function manageSettings(User $user, Course $course): bool
    {
        if ($course->tenant_id !== currentTenant()->id) {
            return false;
        }

        if ($this->isTenantOperator($user, currentTenant())) {
            return $this->auth()->hasPermission($user, currentTenant(), 'courses.manage_settings');
        }

        return $this->isAssignedInstructor($user, $course)
            && $this->auth()->hasPermission($user, currentTenant(), 'courses.update');
    }

    private function isTenantOperator(User $user, Tenant $tenant): bool
    {
        return $this->auth()->hasRole($user, $tenant, 'tenant_owner')
            || $this->auth()->hasRole($user, $tenant, 'admin');
    }

    private function isAssignedInstructor(User $user, Course $course): bool
    {
        $membership = $this->auth()->membershipFor($user, currentTenant());

        if (! $membership || $membership->status !== 'active') {
            return false;
        }

        return $course->created_by_tenant_user_id === $membership->id
            || $course->primary_instructor_tenant_user_id === $membership->id
            || $course->instructors()->where('tenant_user_id', $membership->id)->exists();
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
