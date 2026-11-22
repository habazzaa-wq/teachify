<?php

namespace App\Services\Sessions;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseSession;
use App\Models\CourseSessionEnrollment;
use App\Models\SessionAttendance;
use App\Models\Tenant;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class CourseSessionEnrollmentSyncService
{
    public function syncCourseEnrollment(CourseEnrollment $enrollment): void
    {
        $enrollment->loadMissing('course', 'student');
        $course = $enrollment->course;
        $student = $enrollment->student;

        if (! $course || ! $student || $enrollment->status !== 'active') {
            return;
        }

        $sessions = CourseSession::query()
            ->where('tenant_id', $enrollment->tenant_id)
            ->where('course_id', $enrollment->course_id)
            ->whereIn('status', [
                CourseSession::STATUS_DRAFT,
                CourseSession::STATUS_SCHEDULED,
                CourseSession::STATUS_COMPLETED,
                CourseSession::STATUS_CANCELLED,
            ])
            ->get(['id', 'tenant_id']);

        foreach ($sessions as $session) {
            $this->syncSingle($enrollment->tenant_id, $session->id, $enrollment->id, $enrollment->tenant_user_id);
        }
    }

    public function syncSession(CourseSession $session): void
    {
        $enrollments = CourseEnrollment::query()
            ->where('tenant_id', $session->tenant_id)
            ->where('course_id', $session->course_id)
            ->where('status', 'active')
            ->get(['id', 'tenant_id', 'tenant_user_id']);

        foreach ($enrollments as $enrollment) {
            $this->syncSingle($session->tenant_id, $session->id, $enrollment->id, $enrollment->tenant_user_id);
        }
    }

    public function syncSingle(int $tenantId, int $sessionId, int $courseEnrollmentId, int $tenantUserId): CourseSessionEnrollment
    {
        return DB::transaction(function () use ($tenantId, $sessionId, $courseEnrollmentId, $tenantUserId) {
            $existing = CourseSessionEnrollment::query()
                ->where('tenant_id', $tenantId)
                ->where('course_session_id', $sessionId)
                ->where('tenant_user_id', $tenantUserId)
                ->first();

            if ($existing) {
                if ($existing->course_enrollment_id !== $courseEnrollmentId) {
                    $existing->course_enrollment_id = $courseEnrollmentId;
                }
                if ($existing->status !== CourseSessionEnrollment::STATUS_ENROLLED) {
                    $existing->status = CourseSessionEnrollment::STATUS_ENROLLED;
                    $existing->cancelled_at = null;
                }
                if ($existing->isDirty()) {
                    $existing->save();
                }
                $this->ensureAttendance($tenantId, $sessionId, $existing->id, $tenantUserId);

                return $existing;
            }

            try {
                $enrollment = CourseSessionEnrollment::create([
                    'tenant_id' => $tenantId,
                    'course_session_id' => $sessionId,
                    'course_enrollment_id' => $courseEnrollmentId,
                    'tenant_user_id' => $tenantUserId,
                    'status' => CourseSessionEnrollment::STATUS_ENROLLED,
                    'enrolled_at' => now(),
                ]);
            } catch (QueryException $e) {
                $enrollment = CourseSessionEnrollment::query()
                    ->where('tenant_id', $tenantId)
                    ->where('course_session_id', $sessionId)
                    ->where('tenant_user_id', $tenantUserId)
                    ->firstOrFail();
            }

            $this->ensureAttendance($tenantId, $sessionId, $enrollment->id, $tenantUserId);

            return $enrollment;
        }, 3);
    }

    public function ensureAttendance(int $tenantId, int $sessionId, int $sessionEnrollmentId, int $tenantUserId): SessionAttendance
    {
        $attendance = SessionAttendance::query()
            ->where('tenant_id', $tenantId)
            ->where('course_session_id', $sessionId)
            ->where('tenant_user_id', $tenantUserId)
            ->first();

        if ($attendance) {
            if (! $attendance->course_session_enrollment_id) {
                $attendance->course_session_enrollment_id = $sessionEnrollmentId;
                $attendance->save();
            }

            return $attendance;
        }

        try {
            return SessionAttendance::create([
                'tenant_id' => $tenantId,
                'course_session_id' => $sessionId,
                'course_session_enrollment_id' => $sessionEnrollmentId,
                'tenant_user_id' => $tenantUserId,
                'status' => SessionAttendance::STATUS_PENDING,
            ]);
        } catch (QueryException $e) {
            return SessionAttendance::query()
                ->where('tenant_id', $tenantId)
                ->where('course_session_id', $sessionId)
                ->where('tenant_user_id', $tenantUserId)
                ->firstOrFail();
        }
    }
}
