<?php

namespace App\Policies;

use App\Models\CourseSection;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Instructors\InstructorCourseAuthorization;
use App\Models\Course;

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

        return $this->canAccessSection($user, $section, 'sections.view');
    }

    public function create(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'sections.create');
    }

    public function update(User $user, CourseSection $section): bool
    {
        return $section->tenant_id === currentTenant()->id
            && $this->canAccessSection($user, $section, 'sections.update');
    }

    public function delete(User $user, CourseSection $section): bool
    {
        return $section->tenant_id === currentTenant()->id
            && $this->canAccessSection($user, $section, 'sections.delete');
    }

    public function publish(User $user, CourseSection $section): bool
    {
        return $section->tenant_id === currentTenant()->id
            && $this->canAccessSection($user, $section, 'sections.publish');
    }

    public function feature(User $user, CourseSection $section): bool
    {
        return $section->tenant_id === currentTenant()->id
            && $this->canAccessSection($user, $section, 'sections.feature');
    }

    public function reorder(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'sections.reorder');
    }

    public function reorderForCourse(User $user, Course $course): bool
    {
        return $course->tenant_id === currentTenant()->id
            && app(InstructorCourseAuthorization::class)->canAccessCourse($user, $course)
            && $this->auth()->hasPermission($user, currentTenant(), 'sections.reorder');
    }

    public function restore(User $user): bool
    {
        if (app(InstructorCourseAuthorization::class)->isInstructorAccount($user, currentTenant())) {
            return $this->auth()->hasPermission($user, currentTenant(), 'sections.update');
        }

        return $this->auth()->hasPermission($user, currentTenant(), 'sections.delete');
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }

    private function canAccessSection(User $user, CourseSection $section, string $permission): bool
    {
        if (app(InstructorCourseAuthorization::class)->isInstructorAccount($user, currentTenant())) {
            if (in_array($permission, ['sections.delete', 'sections.publish'], true)) {
                $permission = 'sections.update';
            }

            return app(InstructorCourseAuthorization::class)->canAccessCourse($user, $section->course)
                && $this->auth()->hasPermission($user, currentTenant(), $permission);
        }

        $membership = $this->auth()->membershipFor($user, currentTenant());
        if ($membership && app(InstructorCourseAuthorization::class)
            ->legacyInstructorAccessRevoked($user, $section->course, $membership)) {
            return false;
        }

        return $this->auth()->hasPermission($user, currentTenant(), $permission);
    }
}
