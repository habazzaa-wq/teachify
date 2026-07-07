<?php

namespace App\Policies;

use App\Models\Course;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Access\AccessEvaluationService;
use App\Services\Authorization\TenantAuthorizationService;

class AnalyticsPolicy
{
    public function __construct(
        private readonly TenantAuthorizationService $authorization,
        private readonly AccessEvaluationService $access,
    ) {
    }

    public function viewTenantAnalytics(TenantUser $viewer, Tenant $tenant): bool
    {
        return $this->isTenantOperator($viewer, $tenant);
    }

    public function viewCourseAnalytics(TenantUser $viewer, Tenant $tenant, Course $course): bool
    {
        if ($course->tenant_id !== $tenant->id) {
            return false;
        }

        if ($this->isTenantOperator($viewer, $tenant)) {
            return true;
        }

        return $this->authorization->hasRole($viewer->user, $tenant, 'instructor')
            && $this->isAssignedInstructor($viewer, $course)
            && $this->access->canViewCourse($viewer->user, $course);
    }

    public function viewLearnerAnalytics(TenantUser $viewer, Tenant $tenant, TenantUser $learner): bool
    {
        if ($learner->tenant_id !== $tenant->id) {
            return false;
        }

        return $this->isTenantOperator($viewer, $tenant)
            || (
                $viewer->id === $learner->id
                && $this->authorization->hasRole($viewer->user, $tenant, 'student')
            );
    }

    private function isTenantOperator(TenantUser $viewer, Tenant $tenant): bool
    {
        return $this->authorization->hasRole($viewer->user, $tenant, 'tenant_owner')
            || $this->authorization->hasRole($viewer->user, $tenant, 'admin');
    }

    private function isAssignedInstructor(TenantUser $viewer, Course $course): bool
    {
        return $course->created_by_tenant_user_id === $viewer->id
            || $course->primary_instructor_tenant_user_id === $viewer->id
            || $course->instructors()->where('tenant_user_id', $viewer->id)->exists();
    }
}
