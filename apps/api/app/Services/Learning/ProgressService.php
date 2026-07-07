<?php

namespace App\Services\Learning;

use App\Models\CourseEnrollment;
use App\Models\CourseLesson;
use App\Models\LessonProgress;
use App\Models\TenantUser;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class ProgressService
{
    public function __construct(private readonly CompletionService $completions)
    {
    }

    public function startLesson(CourseLesson $lesson, TenantUser $student): LessonProgress
    {
        $enrollment = $this->activeEnrollmentForLesson($lesson, $student);
        $existing = LessonProgress::query()
            ->where('course_enrollment_id', $enrollment->id)
            ->where('course_lesson_id', $lesson->id)
            ->first();

        return LessonProgress::updateOrCreate(
            [
                'tenant_id' => $lesson->tenant_id,
                'course_enrollment_id' => $enrollment->id,
                'course_lesson_id' => $lesson->id,
            ],
            [
                'course_id' => $lesson->course_id,
                'course_section_id' => $lesson->course_section_id,
                'status' => $existing?->status === 'completed' ? 'completed' : 'in_progress',
                'progress_percent' => max(1, (int) ($existing?->progress_percent ?? 0)),
                'started_at' => $existing?->started_at ?? now(),
                'completed_at' => $existing?->completed_at,
                'last_activity_at' => now(),
            ],
        )->refresh()->load('lesson');
    }

    public function updateLessonProgress(CourseLesson $lesson, TenantUser $student, int $percent): LessonProgress
    {
        $enrollment = $this->activeEnrollmentForLesson($lesson, $student);
        $percent = max(0, min(100, $percent));

        $progress = LessonProgress::updateOrCreate(
            [
                'tenant_id' => $lesson->tenant_id,
                'course_enrollment_id' => $enrollment->id,
                'course_lesson_id' => $lesson->id,
            ],
            [
                'course_id' => $lesson->course_id,
                'course_section_id' => $lesson->course_section_id,
                'status' => $percent >= 100 ? 'completed' : ($percent > 0 ? 'in_progress' : 'not_started'),
                'progress_percent' => $percent,
                'started_at' => $percent > 0 ? (LessonProgress::query()
                    ->where('course_enrollment_id', $enrollment->id)
                    ->where('course_lesson_id', $lesson->id)
                    ->value('started_at') ?? now()) : null,
                'completed_at' => $percent >= 100 ? now() : null,
                'last_activity_at' => now(),
            ],
        )->refresh()->load('lesson');

        $this->completions->synchronize($enrollment);

        return $progress;
    }

    public function completeLesson(CourseLesson $lesson, TenantUser $student): LessonProgress
    {
        return $this->updateLessonProgress($lesson, $student, 100);
    }

    /**
     * @return Collection<int, LessonProgress>
     */
    public function loadStudentProgress(CourseEnrollment $enrollment): Collection
    {
        $this->ensureEnrollmentInCurrentTenant($enrollment);

        return $enrollment->progressRecords()
            ->with('lesson')
            ->orderBy('course_section_id')
            ->orderBy('course_lesson_id')
            ->get();
    }

    private function activeEnrollmentForLesson(CourseLesson $lesson, TenantUser $student): CourseEnrollment
    {
        if ($lesson->tenant_id !== currentTenant()->id || $student->tenant_id !== currentTenant()->id) {
            throw ValidationException::withMessages([
                'lesson' => ['The selected lesson is invalid for this tenant.'],
            ]);
        }

        $enrollment = CourseEnrollment::query()
            ->where('course_id', $lesson->course_id)
            ->where('tenant_user_id', $student->id)
            ->where('status', 'active')
            ->first();

        if (! $enrollment) {
            throw ValidationException::withMessages([
                'enrollment' => ['An active enrollment is required to update lesson progress.'],
            ]);
        }

        return $enrollment;
    }

    private function ensureEnrollmentInCurrentTenant(CourseEnrollment $enrollment): void
    {
        if ($enrollment->tenant_id !== currentTenant()->id) {
            throw ValidationException::withMessages([
                'enrollment' => ['The selected enrollment is invalid for this tenant.'],
            ]);
        }
    }
}
