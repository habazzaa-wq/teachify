<?php

namespace App\Policies;

use App\Models\CourseLesson;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;

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

        return $this->auth()->hasPermission($user, currentTenant(), 'lessons.view');
    }

    public function create(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'lessons.create');
    }

    public function update(User $user, CourseLesson $lesson): bool
    {
        return $lesson->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'lessons.update');
    }

    public function delete(User $user, CourseLesson $lesson): bool
    {
        return $lesson->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'lessons.delete');
    }

    public function publish(User $user, CourseLesson $lesson): bool
    {
        return $lesson->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'lessons.publish');
    }

    public function archive(User $user, CourseLesson $lesson): bool
    {
        return $lesson->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'lessons.archive');
    }

    public function feature(User $user, CourseLesson $lesson): bool
    {
        return $lesson->tenant_id === currentTenant()->id
            && $this->auth()->hasPermission($user, currentTenant(), 'lessons.feature');
    }

    public function reorder(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'lessons.reorder');
    }

    public function restore(User $user): bool
    {
        return $this->auth()->hasPermission($user, currentTenant(), 'lessons.delete');
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
