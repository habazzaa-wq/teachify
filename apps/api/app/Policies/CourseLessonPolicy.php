<?php

namespace App\Policies;

use App\Models\CourseLesson;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Instructors\InstructorCourseAuthorization;
use App\Models\Course;

class CourseLessonPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'lessons.view');
    }

    public function view(User $user, CourseLesson $lesson): bool
    {
        if ($lesson->tenant_id !== currentTenant()->id) {
            return false;
        }

        return $this->canAccessLesson($user, $lesson, 'lessons.view');
    }

    public function create(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'lessons.create');
    }

    public function update(User $user, CourseLesson $lesson): bool
    {
        return $lesson->tenant_id === currentTenant()->id
            && $this->canAccessLesson($user, $lesson, 'lessons.update');
    }

    public function delete(User $user, CourseLesson $lesson): bool
    {
        return $lesson->tenant_id === currentTenant()->id
            && $this->canAccessLesson($user, $lesson, 'lessons.delete');
    }

    public function publish(User $user, CourseLesson $lesson): bool
    {
        return $lesson->tenant_id === currentTenant()->id
            && $this->canAccessLesson($user, $lesson, 'lessons.publish');
    }

    public function archive(User $user, CourseLesson $lesson): bool
    {
        return $lesson->tenant_id === currentTenant()->id
            && $this->canAccessLesson($user, $lesson, 'lessons.archive');
    }

    public function feature(User $user, CourseLesson $lesson): bool
    {
        return $lesson->tenant_id === currentTenant()->id
            && $this->canAccessLesson($user, $lesson, 'lessons.feature');
    }

    public function reorder(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'lessons.reorder');
    }

    public function reorderForCourse(User $user, Course $course): bool
    {
        return $course->tenant_id === currentTenant()->id
            && app(InstructorCourseAuthorization::class)->canAccessCourse($user, $course)
            && $this->auth()->hasPermission($user, currentTenant(), 'lessons.reorder');
    }

    public function restore(User $user): bool
    {
        if (app(InstructorCourseAuthorization::class)->isInstructorAccount($user, currentTenant())) {
            return $this->auth()->hasPermission($user, currentTenant(), 'lessons.update');
        }

        return $this->auth()->hasPermission($user, currentTenant(), 'lessons.delete');
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }

    private function canAccessLesson(User $user, CourseLesson $lesson, string $permission): bool
    {
        if (app(InstructorCourseAuthorization::class)->isInstructorAccount($user, currentTenant())) {
            if (in_array($permission, ['lessons.delete', 'lessons.publish', 'lessons.archive'], true)) {
                $permission = 'lessons.update';
            }

            return app(InstructorCourseAuthorization::class)->canAccessCourse($user, $lesson->course)
                && $this->auth()->hasPermission($user, currentTenant(), $permission);
        }

        $membership = $this->auth()->membershipFor($user, currentTenant());
        if ($membership && app(InstructorCourseAuthorization::class)
            ->legacyInstructorAccessRevoked($user, $lesson->course, $membership)) {
            return false;
        }

        return $this->auth()->hasPermission($user, currentTenant(), $permission);
    }
}
