<?php

namespace App\Policies;

use App\Models\Course;
use App\Models\CourseSession;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Instructors\InstructorCourseAuthorization;
use App\Services\Instructors\InstructorFeature;

class CourseSessionPolicy
{
    public function viewAny(User $user): bool
    {
        $tenant = currentTenant();
        $auth = $this->auth();

        if ($auth->hasPermission($user, $tenant, 'courses.view')) {
            return true;
        }

        $membership = $auth->membershipFor($user, $tenant);

        return $membership !== null && $membership->status === 'active';
    }

    public function view(User $user, CourseSession $session): bool
    {
        $tenant = currentTenant();
        if ($session->tenant_id !== $tenant->id) {
            return false;
        }

        if ($this->isTenantOperator($user, $tenant)) {
            return $this->auth()->hasPermission($user, $tenant, 'courses.view');
        }

        if ($this->isAssignedSessionInstructor($user, $session)) {
            return $this->auth()->hasPermission($user, $tenant, 'courses.view')
                || $this->auth()->hasPermission($user, $tenant, 'courses.update');
        }

        if ($session->status === CourseSession::STATUS_DRAFT) {
            return false;
        }

        return $this->isEnrolledStudent($user, $session);
    }

    public function create(User $user): bool
    {
        $tenant = currentTenant();

        return $this->isTenantOperator($user, $tenant)
            && $this->auth()->hasPermission($user, $tenant, 'courses.update');
    }

    public function update(User $user, CourseSession $session): bool
    {
        $tenant = currentTenant();
        if ($session->tenant_id !== $tenant->id) {
            return false;
        }

        return $this->isTenantOperator($user, $tenant)
            && $this->auth()->hasPermission($user, $tenant, 'courses.update');
    }

    public function delete(User $user, CourseSession $session): bool
    {
        $tenant = currentTenant();
        if ($session->tenant_id !== $tenant->id) {
            return false;
        }

        return $this->isTenantOperator($user, $tenant)
            && $this->auth()->hasPermission($user, $tenant, 'courses.update');
    }

    public function manage(User $user, CourseSession $session): bool
    {
        return $this->update($user, $session);
    }

    private function isAssignedSessionInstructor(User $user, CourseSession $session): bool
    {
        if ($session->instructor_tenant_user_id === null) {
            return false;
        }

        $tenant = currentTenant();
        $membership = $this->auth()->membershipFor($user, $tenant);
        if (! $membership || $membership->status !== 'active') {
            return false;
        }

        if (app(InstructorFeature::class)->isEnabled($tenant)) {
            $instructorMembership = app(InstructorCourseAuthorization::class)->membership($user, $tenant);
            if ($instructorMembership !== null) {
                return $session->instructor_tenant_user_id === $instructorMembership->id;
            }
        }

        $isInstructor = $membership->is_instructor
            || $membership->roles()->where('roles.slug', 'instructor')->exists();

        return $isInstructor && $session->instructor_tenant_user_id === $membership->id;
    }

    private function isEnrolledStudent(User $user, CourseSession $session): bool
    {
        $tenant = currentTenant();
        $membership = $this->auth()->membershipFor($user, $tenant);
        if (! $membership || $membership->status !== 'active') {
            return false;
        }

        return $session->sessionEnrollments()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $membership->id)
            ->where('status', \App\Models\CourseSessionEnrollment::STATUS_ENROLLED)
            ->exists();
    }

    private function isTenantOperator(User $user, Tenant $tenant): bool
    {
        return $this->auth()->hasRole($user, $tenant, 'tenant_owner')
            || $this->auth()->hasRole($user, $tenant, 'admin');
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
