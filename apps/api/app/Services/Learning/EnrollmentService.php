<?php

namespace App\Services\Learning;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Notifications\NotificationEventService;
use Illuminate\Validation\ValidationException;

class EnrollmentService
{
    public function __construct(private readonly NotificationEventService $notificationEvents)
    {
    }

    /**
     * @param array<string, mixed> $metadata
     */
    public function enrollStudent(
        Tenant $tenant,
        Course $course,
        TenantUser $student,
        string $status = 'active',
        array $metadata = [],
    ): CourseEnrollment {
        $this->ensureCourseInTenant($tenant, $course);
        $this->ensureMembershipInTenant($tenant, $student);
        $this->ensureStatus($status);

        if ($status === 'active' && $this->activeEnrollmentExists($course, $student)) {
            throw ValidationException::withMessages([
                'tenant_user_id' => ['The student already has an active enrollment for this course.'],
            ]);
        }

        $enrollment = CourseEnrollment::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'tenant_user_id' => $student->id,
            'status' => $status,
            'enrolled_at' => now(),
            'started_at' => $status === 'active' ? now() : null,
            'completed_at' => $status === 'completed' ? now() : null,
            'cancelled_at' => $status === 'cancelled' ? now() : null,
            'metadata' => $metadata,
        ])->refresh()->load(['course', 'student.user']);

        $this->notificationEvents->record($tenant, 'course.enrolled', 'course-enrollment-'.$enrollment->id, [
            'tenant_user_id' => $student->id,
            'course_id' => $course->id,
            'course_title' => $course->title,
        ]);

        return $enrollment;
    }

    public function activate(CourseEnrollment $enrollment): CourseEnrollment
    {
        if ($enrollment->status !== 'active' && $this->activeEnrollmentExists($enrollment->course, $enrollment->student)) {
            throw ValidationException::withMessages([
                'status' => ['The student already has an active enrollment for this course.'],
            ]);
        }

        return $this->transition($enrollment, 'active', [
            'started_at' => $enrollment->started_at ?? now(),
            'cancelled_at' => null,
        ]);
    }

    public function suspend(CourseEnrollment $enrollment): CourseEnrollment
    {
        return $this->transition($enrollment, 'suspended');
    }

    public function cancel(CourseEnrollment $enrollment): CourseEnrollment
    {
        return $this->transition($enrollment, 'cancelled', [
            'cancelled_at' => now(),
        ]);
    }

    public function complete(CourseEnrollment $enrollment): CourseEnrollment
    {
        return $this->transition($enrollment, 'completed', [
            'completed_at' => now(),
        ]);
    }

    /**
     * @param array<string, mixed> $extra
     */
    private function transition(CourseEnrollment $enrollment, string $target, array $extra = []): CourseEnrollment
    {
        $allowed = [
            'pending' => ['active', 'cancelled', 'suspended'],
            'active' => ['suspended', 'cancelled', 'completed'],
            'suspended' => ['active', 'cancelled'],
            'cancelled' => ['active'],
            'completed' => [],
        ];

        if (! in_array($target, $allowed[$enrollment->status] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition enrollment from {$enrollment->status} to {$target}."],
            ]);
        }

        $enrollment->forceFill(array_merge(['status' => $target], $extra))->save();

        return $enrollment->refresh()->load(['course', 'student.user']);
    }

    private function activeEnrollmentExists(Course $course, TenantUser $student): bool
    {
        return CourseEnrollment::query()
            ->where('course_id', $course->id)
            ->where('tenant_user_id', $student->id)
            ->where('status', 'active')
            ->exists();
    }

    private function ensureCourseInTenant(Tenant $tenant, Course $course): void
    {
        if ($course->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'course' => ['The selected course is invalid for this tenant.'],
            ]);
        }
    }

    private function ensureMembershipInTenant(Tenant $tenant, TenantUser $membership): void
    {
        if ($membership->tenant_id !== $tenant->id || $membership->status !== 'active') {
            throw ValidationException::withMessages([
                'tenant_user_id' => ['The selected tenant membership is invalid.'],
            ]);
        }
    }

    private function ensureStatus(string $status): void
    {
        if (! in_array($status, ['pending', 'active', 'completed', 'cancelled', 'suspended'], true)) {
            throw ValidationException::withMessages([
                'status' => ['The selected enrollment status is invalid.'],
            ]);
        }
    }
}
