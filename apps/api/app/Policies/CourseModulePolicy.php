<?php

namespace App\Policies;

use App\Models\CourseModule;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Instructors\InstructorCourseAuthorization;
use App\Models\Course;

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

        return $this->canAccessModule($user, $module, 'modules.view');
    }

    public function create(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'modules.create');
    }

    public function update(User $user, CourseModule $module): bool
    {
        return $module->tenant_id === currentTenant()->id
            && $this->canAccessModule($user, $module, 'modules.update');
    }

    public function delete(User $user, CourseModule $module): bool
    {
        return $module->tenant_id === currentTenant()->id
            && $this->canAccessModule($user, $module, 'modules.delete');
    }

    public function publish(User $user, CourseModule $module): bool
    {
        return $module->tenant_id === currentTenant()->id
            && $this->canAccessModule($user, $module, 'modules.publish');
    }

    public function archive(User $user, CourseModule $module): bool
    {
        return $module->tenant_id === currentTenant()->id
            && $this->canAccessModule($user, $module, 'modules.archive');
    }

    public function feature(User $user, CourseModule $module): bool
    {
        return $module->tenant_id === currentTenant()->id
            && $this->canAccessModule($user, $module, 'modules.feature');
    }

    public function reorder(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'modules.reorder');
    }

    public function reorderForCourse(User $user, Course $course): bool
    {
        return $course->tenant_id === currentTenant()->id
            && $this->canAccessCourse($user, $course)
            && $this->auth()->hasPermission($user, currentTenant(), 'modules.reorder');
    }

    public function restore(User $user): bool
    {
        if (app(InstructorCourseAuthorization::class)->isInstructorAccount($user, currentTenant())) {
            return $this->auth()->hasPermission($user, currentTenant(), 'modules.update');
        }

        return $this->auth()->hasPermission($user, currentTenant(), 'modules.delete');
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }

    private function canAccessModule(User $user, CourseModule $module, string $permission): bool
    {
        if (app(InstructorCourseAuthorization::class)->isInstructorAccount($user, currentTenant())) {
            if (in_array($permission, ['modules.delete', 'modules.publish', 'modules.archive'], true)) {
                $permission = 'modules.update';
            }

            return $this->canAccessCourse($user, $module->course)
                && $this->auth()->hasPermission($user, currentTenant(), $permission);
        }

        $membership = $this->auth()->membershipFor($user, currentTenant());
        if ($membership && app(InstructorCourseAuthorization::class)
            ->legacyInstructorAccessRevoked($user, $module->course, $membership)) {
            return false;
        }

        return $this->auth()->hasPermission($user, currentTenant(), $permission);
    }

    private function canAccessCourse(User $user, Course $course): bool
    {
        return app(InstructorCourseAuthorization::class)->canAccessCourse($user, $course);
    }
}
