<?php

namespace App\Services\Instructors;

use App\Models\Course;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;
use App\Services\Authorization\TenantAuthorizationService;

class InstructorCourseAuthorization
{
    public function membership(User $user, Tenant $tenant): ?TenantUser
    {
        if (! app(InstructorFeature::class)->isEnabled($tenant)) {
            return null;
        }

        $token = $user->currentAccessToken();
        if (! $token instanceof PersonalAccessToken
            || $token->name !== 'instructor_access_token'
            || ! in_array('instructor:tenant:'.$tenant->id, $token->abilities, true)
            || ! in_array('instructor:access', $token->abilities, true)) {
            return null;
        }

        $membership = TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->where('is_instructor', true)
            ->with('roles')
            ->first();

        if (! $membership || $membership->roles->count() !== 1
            || $membership->roles->first()?->slug !== 'instructor') {
            return null;
        }

        return $membership;
    }

    public function canAccessCourse(User $user, Course $course): bool
    {
        if ($course->tenant_id !== currentTenant()->id) {
            return false;
        }

        $membership = $this->membership($user, currentTenant());

        return $membership !== null
            && $course->primary_instructor_tenant_user_id === $membership->id;
    }

    public function isInstructorAccount(User $user, Tenant $tenant): bool
    {
        if (! app(InstructorFeature::class)->isEnabled($tenant)) {
            return false;
        }

        $membership = TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        return $membership !== null
            && ($membership->is_instructor || $membership->roles()->where('roles.slug', 'instructor')->exists());
    }

    public function legacyInstructorAccessRevoked(User $user, Course $course, TenantUser $membership): bool
    {
        if (app(InstructorFeature::class)->isEnabled(currentTenant())
            || ! $course->instructor_assignment_managed
            || $course->tenant_id !== currentTenant()->id
            || $membership->tenant_id !== $course->tenant_id
            || $membership->status !== 'active') {
            return false;
        }

        $authorization = app(TenantAuthorizationService::class);
        if ($authorization->hasRole($user, currentTenant(), 'tenant_owner')
            || $authorization->hasRole($user, currentTenant(), 'admin')) {
            return false;
        }

        $isInstructor = $membership->is_instructor
            || $membership->roles()->where('roles.slug', 'instructor')->exists();

        return $isInstructor && $course->primary_instructor_tenant_user_id !== $membership->id;
    }
}
