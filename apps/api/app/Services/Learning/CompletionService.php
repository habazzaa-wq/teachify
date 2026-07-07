<?php

namespace App\Services\Learning;

use App\Models\CourseCompletion;
use App\Models\CourseEnrollment;
use App\Models\CourseLesson;
use App\Models\LessonProgress;
use App\Services\Certificates\CertificateIssuanceService;
use App\Services\Notifications\NotificationEventService;

class CompletionService
{
    public function __construct(private readonly NotificationEventService $notificationEvents)
    {
    }

    public function calculate(CourseEnrollment $enrollment): int
    {
        $totalLessons = CourseLesson::query()
            ->where('course_id', $enrollment->course_id)
            ->count();

        if ($totalLessons === 0) {
            return 0;
        }

        $completedLessons = LessonProgress::query()
            ->where('course_enrollment_id', $enrollment->id)
            ->where('status', 'completed')
            ->count();

        return (int) floor(($completedLessons / $totalLessons) * 100);
    }

    public function synchronize(CourseEnrollment $enrollment): CourseCompletion
    {
        $percent = $this->calculate($enrollment);

        $completion = CourseCompletion::updateOrCreate(
            [
                'tenant_id' => $enrollment->tenant_id,
                'course_id' => $enrollment->course_id,
                'course_enrollment_id' => $enrollment->id,
            ],
            [
                'completion_percent' => $percent,
                'completed_at' => $percent >= 100 ? now() : null,
            ],
        );

        if ($percent >= 100) {
            $this->markEnrollmentCompleted($enrollment);
            $this->notificationEvents->record($enrollment->tenant, 'course.completed', 'course-completion-'.$enrollment->id, [
                'tenant_user_id' => $enrollment->tenant_user_id,
                'course_id' => $enrollment->course_id,
                'course_title' => $enrollment->course?->title,
            ]);
        }

        app(CertificateIssuanceService::class)->evaluateAndIssue($completion->refresh());

        return $completion->refresh();
    }

    public function markEnrollmentCompleted(CourseEnrollment $enrollment): CourseEnrollment
    {
        if ($enrollment->status !== 'completed') {
            $enrollment->forceFill([
                'status' => 'completed',
                'completed_at' => now(),
            ])->save();
        }

        return $enrollment->refresh();
    }
}
