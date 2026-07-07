<?php

namespace App\Services\Access;

use App\Models\Course;
use App\Models\CourseAccessRule;
use App\Models\CourseEnrollment;
use App\Models\CourseLesson;
use App\Models\LessonAccessRule;
use App\Models\LessonProgress;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;
use Illuminate\Database\Eloquent\Builder;

class AccessEvaluationService
{
    public function __construct(private readonly TenantAuthorizationService $authorization)
    {
    }

    public function canViewCourse(User $user, Course $course): bool
    {
        return $this->evaluateCourseVisibility($user, $course)->allowed;
    }

    public function canEnroll(User $user, Course $course): bool
    {
        $tenant = currentTenant();
        $rule = $this->courseRule($course);
        $membership = $this->membership($user, $tenant);

        if ($course->tenant_id !== $tenant->id) {
            return false;
        }

        if (! $membership || ! $this->authorization->hasRole($user, $tenant, 'student')) {
            return false;
        }

        if ($course->status !== 'published' || $rule->access_mode === 'private') {
            return false;
        }

        if ($rule->invite_only || $rule->requires_approval || ! $rule->allow_self_enrollment) {
            return false;
        }

        return ! $this->activeEnrollment($course, $membership);
    }

    public function canAccessLesson(User $user, CourseLesson $lesson): bool
    {
        return $this->evaluateLessonVisibility($user, $lesson)->allowed;
    }

    public function canAccessMedia(User $user, CourseLesson $lesson): bool
    {
        return $this->canAccessLesson($user, $lesson);
    }

    /**
     * @param Builder<Course> $query
     */
    public function applyCourseVisibility(Builder $query, User $user): void
    {
        $tenant = currentTenant();
        $membership = $this->membership($user, $tenant);

        if ($this->isTenantOperator($user, $tenant)) {
            return;
        }

        if (! $membership) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->where(function (Builder $query) use ($membership): void {
            $query
                ->where('created_by_tenant_user_id', $membership->id)
                ->orWhere('primary_instructor_tenant_user_id', $membership->id)
                ->orWhereHas('instructors', function (Builder $query) use ($membership): void {
                    $query->where('tenant_user_id', $membership->id);
                })
                ->orWhere(function (Builder $query) use ($membership): void {
                    $query
                        ->where('status', 'published')
                        ->where(function (Builder $query) use ($membership): void {
                            $query
                                ->whereHas('accessRule', function (Builder $query): void {
                                    $query->where('access_mode', 'public');
                                })
                                ->orWhere(function (Builder $query): void {
                                    $query
                                        ->whereDoesntHave('accessRule')
                                        ->where('visibility', 'public');
                                })
                                ->orWhere(function (Builder $query) use ($membership): void {
                                    $query
                                        ->where(function (Builder $query): void {
                                            $query
                                                ->whereHas('accessRule', function (Builder $query): void {
                                                    $query->where('access_mode', 'enrolled_only');
                                                })
                                                ->orWhere(function (Builder $query): void {
                                                    $query
                                                        ->whereDoesntHave('accessRule')
                                                        ->where('visibility', 'enrolled_only');
                                                });
                                        })
                                        ->whereHas('enrollments', function (Builder $query) use ($membership): void {
                                            $query
                                                ->where('tenant_user_id', $membership->id)
                                                ->where('status', 'active');
                                        });
                                });
                        });
                });
        });
    }

    /**
     * @param Builder<CourseLesson> $query
     */
    public function applyLessonVisibility($query, User $user): void
    {
        $ids = (clone $query)
            ->with(['course.accessRule', 'section', 'accessRule'])
            ->get()
            ->filter(fn (CourseLesson $lesson): bool => $this->canAccessLesson($user, $lesson))
            ->pluck('id')
            ->all();

        $query->whereIn('id', $ids);
    }

    public function evaluateCourseVisibility(User $user, Course $course): AccessEvaluation
    {
        $tenant = currentTenant();

        if ($course->tenant_id !== $tenant->id) {
            return new AccessEvaluation(false, ['tenant_mismatch']);
        }

        if ($this->isTenantOperator($user, $tenant) || $this->isAssignedInstructor($user, $course)) {
            return new AccessEvaluation(true, ['staff_access'], [
                'access_mode' => $this->courseRule($course)->access_mode,
            ]);
        }

        if ($course->status !== 'published') {
            return new AccessEvaluation(false, ['course_not_published']);
        }

        $rule = $this->courseRule($course);
        $membership = $this->membership($user, $tenant);
        $enrollment = $membership ? $this->activeEnrollment($course, $membership) : null;

        return match ($rule->access_mode) {
            'public' => new AccessEvaluation(true, ['public_course'], ['access_mode' => 'public']),
            'enrolled_only' => new AccessEvaluation((bool) $enrollment, $enrollment ? ['active_enrollment'] : ['enrollment_required'], [
                'access_mode' => 'enrolled_only',
                'enrollment_id' => $enrollment?->id,
            ]),
            default => new AccessEvaluation(false, ['private_course'], ['access_mode' => 'private']),
        };
    }

    public function evaluateLessonVisibility(User $user, CourseLesson $lesson): AccessEvaluation
    {
        $tenant = currentTenant();

        if ($lesson->tenant_id !== $tenant->id || $lesson->course->tenant_id !== $tenant->id) {
            return new AccessEvaluation(false, ['tenant_mismatch']);
        }

        if ($this->isTenantOperator($user, $tenant) || $this->isAssignedInstructor($user, $lesson->course)) {
            return new AccessEvaluation(true, ['staff_access'], [
                'access_mode' => $this->lessonRule($lesson)->access_mode,
            ]);
        }

        if ($lesson->course->status !== 'published') {
            return new AccessEvaluation(false, ['course_not_published']);
        }

        if ($lesson->status !== 'published') {
            return new AccessEvaluation(false, ['lesson_not_published']);
        }

        if (! $lesson->section?->is_published) {
            return new AccessEvaluation(false, ['section_not_published']);
        }

        $rule = $this->lessonRule($lesson);
        $windowEvaluation = $this->evaluateWindow($rule);

        if (! $windowEvaluation->allowed) {
            return $windowEvaluation;
        }

        $membership = $this->membership($user, $tenant);
        $enrollment = $membership ? $this->activeEnrollment($lesson->course, $membership) : null;

        if ($rule->prerequisite_lesson_id && ! $this->hasCompletedPrerequisite($rule, $enrollment)) {
            return new AccessEvaluation(false, ['prerequisite_incomplete'], [
                'access_mode' => $rule->access_mode,
                'prerequisite_lesson_id' => $rule->prerequisite_lesson_id,
            ]);
        }

        return match ($rule->access_mode) {
            'public_preview' => $this->evaluatePublicPreview($lesson, $rule),
            'enrolled_only' => new AccessEvaluation((bool) $enrollment, $enrollment ? ['active_enrollment'] : ['enrollment_required'], [
                'access_mode' => 'enrolled_only',
                'enrollment_id' => $enrollment?->id,
            ]),
            'scheduled' => $this->evaluateScheduledLesson($user, $lesson, $enrollment),
            'drip' => new AccessEvaluation((bool) $enrollment, $enrollment ? ['drip_available'] : ['enrollment_required'], [
                'access_mode' => 'drip',
                'enrollment_id' => $enrollment?->id,
                'metadata' => $rule->metadata ?? [],
            ]),
            default => $this->evaluateCourseVisibility($user, $lesson->course),
        };
    }

    public function courseRule(Course $course): CourseAccessRule
    {
        return $course->accessRule ?: new CourseAccessRule([
            'tenant_id' => $course->tenant_id,
            'course_id' => $course->id,
            'access_mode' => $course->visibility,
            'requires_approval' => false,
            'allow_self_enrollment' => false,
            'invite_only' => false,
            'metadata' => [],
        ]);
    }

    public function lessonRule(CourseLesson $lesson): LessonAccessRule
    {
        return $lesson->accessRule ?: new LessonAccessRule([
            'tenant_id' => $lesson->tenant_id,
            'course_id' => $lesson->course_id,
            'course_lesson_id' => $lesson->id,
            'access_mode' => 'inherit_course',
            'available_from' => null,
            'available_until' => null,
            'prerequisite_lesson_id' => null,
            'metadata' => [],
        ]);
    }

    private function evaluateScheduledLesson(User $user, CourseLesson $lesson, ?CourseEnrollment $enrollment): AccessEvaluation
    {
        $courseEvaluation = $this->evaluateCourseVisibility($user, $lesson->course);

        if (! $courseEvaluation->allowed && ! $enrollment) {
            return new AccessEvaluation(false, ['course_access_required'], [
                'access_mode' => 'scheduled',
            ]);
        }

        return new AccessEvaluation(true, ['scheduled_available'], [
            'access_mode' => 'scheduled',
            'enrollment_id' => $enrollment?->id,
            'lesson_id' => $lesson->id,
        ]);
    }

    private function evaluatePublicPreview(CourseLesson $lesson, LessonAccessRule $rule): AccessEvaluation
    {
        if ($this->courseRule($lesson->course)->access_mode === 'private') {
            return new AccessEvaluation(false, ['private_course'], [
                'access_mode' => $rule->access_mode,
            ]);
        }

        return new AccessEvaluation(true, ['public_preview'], [
            'access_mode' => 'public_preview',
        ]);
    }

    private function evaluateWindow(LessonAccessRule $rule): AccessEvaluation
    {
        $now = now();

        if ($rule->available_from && $now->lt($rule->available_from)) {
            return new AccessEvaluation(false, ['not_yet_available'], [
                'available_from' => $rule->available_from,
            ]);
        }

        if ($rule->available_until && $now->gt($rule->available_until)) {
            return new AccessEvaluation(false, ['availability_expired'], [
                'available_until' => $rule->available_until,
            ]);
        }

        return new AccessEvaluation(true);
    }

    private function hasCompletedPrerequisite(LessonAccessRule $rule, ?CourseEnrollment $enrollment): bool
    {
        if (! $enrollment) {
            return false;
        }

        return LessonProgress::query()
            ->where('course_enrollment_id', $enrollment->id)
            ->where('course_lesson_id', $rule->prerequisite_lesson_id)
            ->where('status', 'completed')
            ->exists();
    }

    private function activeEnrollment(Course $course, TenantUser $membership): ?CourseEnrollment
    {
        return CourseEnrollment::query()
            ->where('course_id', $course->id)
            ->where('tenant_user_id', $membership->id)
            ->where('status', 'active')
            ->first();
    }

    private function membership(User $user, Tenant $tenant): ?TenantUser
    {
        $membership = $this->authorization->membershipFor($user, $tenant);

        return $membership?->status === 'active' ? $membership : null;
    }

    private function isTenantOperator(User $user, Tenant $tenant): bool
    {
        return $this->authorization->hasRole($user, $tenant, 'tenant_owner')
            || $this->authorization->hasRole($user, $tenant, 'admin');
    }

    private function isAssignedInstructor(User $user, Course $course): bool
    {
        $membership = $this->membership($user, currentTenant());

        if (! $membership) {
            return false;
        }

        return $course->created_by_tenant_user_id === $membership->id
            || $course->primary_instructor_tenant_user_id === $membership->id
            || $course->instructors()->where('tenant_user_id', $membership->id)->exists();
    }
}
