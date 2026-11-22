<?php

namespace App\Policies;

use App\Models\CourseSession;
use App\Models\SessionAttendance;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Instructors\InstructorCourseAuthorization;
use App\Services\Instructors\InstructorFeature;

class SessionAttendancePolicy
{
    public function viewAny(User $user, CourseSession $session): bool
    {
        return $this->canManageSessionAttendance($user, $session);
    }

    public function view(User $user, SessionAttendance $attendance): bool
    {
        $tenant = currentTenant();
        if ($attendance->tenant_id !== $tenant->id) {
            return false;
        }

        $session = $attendance->session;
        if (! $session || $session->tenant_id !== $tenant->id) {
            return false;
        }

        if ($this->canManageSessionAttendance($user, $session)) {
            return true;
        }

        $membership = $this->auth()->membershipFor($user, $tenant);

        return $membership !== null
            && $membership->status === 'active'
            && $attendance->tenant_user_id === $membership->id;
    }

    public function create(User $user, CourseSession $session): bool
    {
        return $this->canManageSessionAttendance($user, $session);
    }

    public function update(User $user, SessionAttendance $attendance): bool
    {
        $tenant = currentTenant();
        if ($attendance->tenant_id !== $tenant->id) {
            return false;
        }

        $session = $attendance->session;
        if (! $session || $session->tenant_id !== $tenant->id) {
            return false;
        }

        return $this->canManageSessionAttendance($user, $session);
    }

    public function manage(User $user, CourseSession $session): bool
    {
        return $this->canManageSessionAttendance($user, $session);
    }

    private function canManageSessionAttendance(User $user, CourseSession $session): bool
    {
        $tenant = currentTenant();
        if ($session->tenant_id !== $tenant->id) {
            return false;
        }

        if ($this->isTenantOperator($user, $tenant)
            && $this->auth()->hasPermission($user, $tenant, 'courses.update')) {
            return true;
        }

        return $this->isAssignedSessionInstructor($user, $session);
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
