<?php

namespace App\Services\Analytics;

use App\Models\Course;
use App\Models\CourseAnalytics;
use App\Models\LearnerAnalytics;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Policies\AnalyticsPolicy;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;

class AnalyticsQueryService
{
    public function __construct(private readonly AnalyticsPolicy $policy)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function tenantOverview(Tenant $tenant, TenantUser $viewer): array
    {
        if (! $this->policy->viewTenantAnalytics($viewer, $tenant)) {
            throw new AuthorizationException('This action is unauthorized.');
        }

        return $this->tenantOverviewPayload($tenant);
    }

    /**
     * @return array<string, mixed>
     */
    public function tenantOverviewPayload(Tenant $tenant): array
    {
        return [
            'courses_count' => CourseAnalytics::query()->where('tenant_id', $tenant->id)->count(),
            'learners_count' => LearnerAnalytics::query()->where('tenant_id', $tenant->id)->count(),
            'enrollments_count' => (int) CourseAnalytics::query()->where('tenant_id', $tenant->id)->sum('enrollments_count'),
            'active_learners_count' => (int) CourseAnalytics::query()->where('tenant_id', $tenant->id)->sum('active_learners_count'),
            'completed_learners_count' => (int) CourseAnalytics::query()->where('tenant_id', $tenant->id)->sum('completed_learners_count'),
            'average_completion_rate' => $this->number(CourseAnalytics::query()->where('tenant_id', $tenant->id)->avg('completion_rate')),
            'average_progress_percent' => $this->number(CourseAnalytics::query()->where('tenant_id', $tenant->id)->avg('average_progress_percent')),
            'average_quiz_score' => $this->number(CourseAnalytics::query()->where('tenant_id', $tenant->id)->avg('average_quiz_score')),
            'average_assignment_score' => $this->number(CourseAnalytics::query()->where('tenant_id', $tenant->id)->avg('average_assignment_score')),
        ];
    }

    /**
     * @return Collection<int, CourseAnalytics>
     */
    public function courses(Tenant $tenant, TenantUser $viewer): Collection
    {
        if ($this->policy->viewTenantAnalytics($viewer, $tenant)) {
            return CourseAnalytics::query()
                ->with('course')
                ->where('tenant_id', $tenant->id)
                ->orderBy('course_id')
                ->get();
        }

        $courseIds = Course::query()
            ->where('tenant_id', $tenant->id)
            ->get()
            ->filter(fn (Course $course): bool => $this->policy->viewCourseAnalytics($viewer, $tenant, $course))
            ->pluck('id')
            ->all();

        if ($courseIds === []) {
            throw new AuthorizationException('This action is unauthorized.');
        }

        return CourseAnalytics::query()
            ->with('course')
            ->where('tenant_id', $tenant->id)
            ->whereIn('course_id', $courseIds)
            ->orderBy('course_id')
            ->get();
    }

    /**
     * @return Collection<int, LearnerAnalytics>
     */
    public function learners(Tenant $tenant, TenantUser $viewer): Collection
    {
        if ($this->policy->viewTenantAnalytics($viewer, $tenant)) {
            return LearnerAnalytics::query()
                ->with('learner.user')
                ->where('tenant_id', $tenant->id)
                ->orderBy('tenant_user_id')
                ->get();
        }

        return $this->policy->viewLearnerAnalytics($viewer, $tenant, $viewer)
            ? LearnerAnalytics::query()
                ->with('learner.user')
                ->where('tenant_id', $tenant->id)
                ->where('tenant_user_id', $viewer->id)
                ->get()
            : throw new AuthorizationException('This action is unauthorized.');
    }

    public function course(Tenant $tenant, TenantUser $viewer, Course $course): CourseAnalytics
    {
        if ($course->tenant_id !== $tenant->id) {
            abort(404);
        }

        if (! $this->policy->viewCourseAnalytics($viewer, $tenant, $course)) {
            throw new AuthorizationException('This action is unauthorized.');
        }

        $analytics = CourseAnalytics::query()
            ->where('tenant_id', $tenant->id)
            ->where('course_id', $course->id)
            ->first();

        abort_if(! $analytics, 404);

        return $analytics->load('course');
    }

    public function learner(Tenant $tenant, TenantUser $viewer, TenantUser $learner): LearnerAnalytics
    {
        if ($learner->tenant_id !== $tenant->id) {
            abort(404);
        }

        if (! $this->policy->viewLearnerAnalytics($viewer, $tenant, $learner)) {
            throw new AuthorizationException('This action is unauthorized.');
        }

        $analytics = LearnerAnalytics::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $learner->id)
            ->first();

        abort_if(! $analytics, 404);

        return $analytics->load('learner.user');
    }

    private function number(mixed $value): float
    {
        return round((float) ($value ?? 0), 2);
    }
}
