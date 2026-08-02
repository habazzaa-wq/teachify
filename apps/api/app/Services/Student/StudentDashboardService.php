<?php

namespace App\Services\Student;

use App\Models\CourseCompletion;
use App\Models\CourseEnrollment;
use App\Models\CourseLesson;
use App\Models\ExamAttempt;
use App\Models\IssuedCertificate;
use App\Models\LessonProgress;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Builds the aggregated read-only payload for the learner dashboard
 * (hero, stats, continue learning, recent attempts, upcoming tasks,
 * activity timeline, achievements and calendar). All numbers are derived
 * from real persisted records; nothing is fabricated.
 */
class StudentDashboardService
{
    public function dashboard(User $user, TenantUser $membership, Tenant $tenant): array
    {
        $membershipId = $membership->id;

        $enrollments = CourseEnrollment::query()
            ->with(['course', 'completion'])
            ->where('tenant_user_id', $membershipId)
            ->orderByDesc('enrolled_at')
            ->get();

        $enrollmentIds = $enrollments->pluck('id');

        $completions = CourseCompletion::query()
            ->whereIn('course_enrollment_id', $enrollmentIds)
            ->get()
            ->keyBy('course_enrollment_id');

        $submittedAttempts = $this->recentAttempts($user, 6);

        $certificates = IssuedCertificate::query()
            ->with('course:id,title')
            ->where('tenant_user_id', $membershipId)
            ->orderByDesc('issued_at')
            ->get();

        $recentProgress = $this->recentLessonProgress($enrollmentIds);

        $progressByEnrollment = $this->progressByEnrollment($enrollments, $completions);

        $activityDates = $this->collectActivityDates($enrollments, $recentProgress, $submittedAttempts, $certificates);

        return [
            'student' => $this->student($membership, $user),
            'stats' => $this->stats($enrollments, $progressByEnrollment, $submittedAttempts, $certificates, $activityDates),
            'continueLearning' => $this->continueLearning($enrollments, $completions),
            'recentAttempts' => $this->formatAttempts($submittedAttempts),
            'upcomingTasks' => $this->upcomingTasks($enrollments, $completions, $user),
            'timeline' => $this->timeline($enrollments, $recentProgress, $completions, $submittedAttempts, $certificates),
            'achievements' => $this->achievements($completions, $submittedAttempts, $certificates),
            'calendar' => $this->calendar($enrollments, $user),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function student(TenantUser $membership, User $user): array
    {
        return [
            'id' => (string) $membership->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $membership->avatar ?? $user->avatar ?? null,
            'phone' => $membership->phone ?? '',
            'gender' => $membership->gender ?? '',
            'nationality' => $membership->nationality ?? '',
            'studyLevel' => $membership->study_level ?? '',
            'governorate' => $membership->governorate ?? '',
            'city' => $membership->city ?? '',
            'status' => $membership->status,
            'joinedAt' => $membership->joined_at?->toIso8601String(),
        ];
    }

    /**
     * @param Collection<int, CourseEnrollment> $enrollments
     * @param array<int, int> $progressByEnrollment
     * @param Collection<int, ExamAttempt> $attempts
     * @param Collection<int, IssuedCertificate> $certificates
     * @param Collection<int, string> $activityDates
     *
     * @return array<string, mixed>
     */
    private function stats(
        Collection $enrollments,
        array $progressByEnrollment,
        Collection $attempts,
        Collection $certificates,
        Collection $activityDates,
    ): array {
        $eligibleEnrollments = $enrollments->where('status', '!==', 'cancelled');

        $completedCompletions = $this->completedCount($eligibleEnrollments, $progressByEnrollment);

        $percentages = $attempts->map(fn (ExamAttempt $attempt): ?float => $attempt->percentage);

        $passedCount = $attempts->where('passed', true)->count();

        return [
            'enrolledCoursesCount' => $eligibleEnrollments->count(),
            'completedCoursesCount' => $completedCompletions,
            'averageProgressPercent' => $this->roundOne(collect($progressByEnrollment)->avg()),
            'averageExamScorePercent' => $this->roundOne($percentages->avg()),
            'certificatesCount' => $certificates->count(),
            'attemptsCount' => $attempts->count(),
            'passedAttemptsCount' => $passedCount,
            'activeDaysCount' => $activityDates->count(),
            'currentStreakDays' => $this->currentStreak($activityDates),
            'lastActivityAt' => $activityDates->max() !== null ? $activityDates->max() : null,
        ];
    }

    /**
     * @param Collection<int, CourseEnrollment> $enrollments
     * @param Collection<string, CourseCompletion> $completions
     *
     * @return list<array<string, mixed>>
     */
    private function continueLearning(Collection $enrollments, Collection $completions): array
    {
        $active = $enrollments->where('status', 'active');

        if ($active->isEmpty()) {
            return [];
        }

        $courseIds = $active->pluck('course_id')->unique();
        $enrollmentIds = $active->pluck('id');

        $totalLessonsByCourse = CourseLesson::query()
            ->whereIn('course_id', $courseIds)
            ->selectRaw('course_id, COUNT(*) as total')
            ->groupBy('course_id')
            ->pluck('total', 'course_id');

        $completedByEnrollment = LessonProgress::query()
            ->whereIn('course_enrollment_id', $enrollmentIds)
            ->where('status', 'completed')
            ->selectRaw('course_enrollment_id, COUNT(*) as total')
            ->groupBy('course_enrollment_id')
            ->pluck('total', 'course_enrollment_id');

        $lessonsByCourse = CourseLesson::query()
            ->whereIn('course_id', $courseIds)
            ->where('status', 'published')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'course_id', 'title'])
            ->groupBy('course_id');

        $completedLessonIdsByEnrollment = LessonProgress::query()
            ->whereIn('course_enrollment_id', $enrollmentIds)
            ->where('status', 'completed')
            ->get(['course_enrollment_id', 'course_lesson_id'])
            ->groupBy('course_enrollment_id')
            ->map(fn (Collection $rows): Collection => $rows->pluck('course_lesson_id'));

        $items = [];

        foreach ($active as $enrollment) {
            $course = $enrollment->course;

            if ($course === null) {
                continue;
            }

            $total = (int) ($totalLessonsByCourse->get($course->id) ?? 0);
            $completed = (int) ($completedByEnrollment->get($enrollment->id) ?? 0);

            $progress = $completions->get($enrollment->id)?->completion_percent;

            if ($progress === null && $total > 0) {
                $progress = (int) floor(($completed / $total) * 100);
            }

            $progress = (int) ($progress ?? 0);

            if ($progress >= 100) {
                continue;
            }

            $nextLesson = $this->nextLesson($lessonsByCourse->get($course->id, collect()), $completedLessonIdsByEnrollment->get($enrollment->id, collect()));

            $items[] = [
                'enrollmentId' => (string) $enrollment->id,
                'courseId' => (string) $course->id,
                'courseTitle' => $course->title,
                'courseSlug' => $course->slug,
                'thumbnail' => $course->thumbnail_path,
                'progressPercent' => $progress,
                'completedLessonsCount' => $completed,
                'totalLessonsCount' => $total,
                'lastActivityAt' => $enrollment->completion?->updated_at?->toIso8601String()
                    ?? $enrollment->started_at?->toIso8601String(),
                'nextLessonId' => $nextLesson !== null ? (string) $nextLesson->id : null,
                'nextLessonTitle' => $nextLesson?->title,
            ];
        }

        return $items;
    }

    /**
     * @param Collection<int, CourseLesson> $lessons
     * @param Collection<int, int> $completedIds
     */
    private function nextLesson(Collection $lessons, Collection $completedIds): ?CourseLesson
    {
        return $lessons->first(fn (CourseLesson $lesson): bool => ! $completedIds->contains($lesson->id));
    }

    /**
     * @return Collection<int, ExamAttempt>
     */
    private function recentAttempts(User $user, int $limit): Collection
    {
        return ExamAttempt::query()
            ->with('exam')
            ->where('user_id', $user->id)
            ->where('status', 'submitted')
            ->orderByDesc('submitted_at')
            ->limit($limit)
            ->get();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function formatAttempts(Collection $attempts): array
    {
        if ($attempts->isEmpty()) {
            return [];
        }

        $examIds = $attempts->pluck('exam_id')->filter()->unique();

        $courseByExam = CourseLesson::query()
            ->whereIn('exam_id', $examIds)
            ->with('course:id,title,slug')
            ->get()
            ->filter(fn (CourseLesson $lesson): bool => $lesson->course !== null)
            ->mapWithKeys(fn (CourseLesson $lesson): array => [$lesson->exam_id => $lesson->course]);

        return $attempts->values()
            ->map(fn (ExamAttempt $attempt): array => [
                'attemptId' => (string) $attempt->id,
                'examId' => (string) $attempt->exam_id,
                'examTitle' => $attempt->exam?->title ?? '',
                'status' => $attempt->status,
                'isPractice' => $attempt->is_practice,
                'score' => (float) $attempt->score,
                'maxScore' => (float) $attempt->max_score,
                'percentage' => $attempt->percentage !== null ? (float) $attempt->percentage : null,
                'passed' => $attempt->passed,
                'submittedAt' => $attempt->submitted_at?->toIso8601String(),
                'courseTitle' => $courseByExam->get($attempt->exam_id)?->title,
                'courseSlug' => $courseByExam->get($attempt->exam_id)?->slug,
            ])
            ->all();
    }

    /**
     * @param Collection<int, CourseEnrollment> $enrollments
     * @param Collection<string, CourseCompletion> $completions
     *
     * @return list<array<string, mixed>>
     */
    private function upcomingTasks(Collection $enrollments, Collection $completions, User $user): array
    {
        $tasks = [];

        $inProgress = ExamAttempt::query()
            ->with('exam')
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->orderBy('timer_ends_at')
            ->get();

        foreach ($inProgress as $attempt) {
            if ($attempt->exam === null) {
                continue;
            }

            $tasks[] = [
                'id' => 'exam-'.$attempt->id,
                'type' => 'exam',
                'title' => $attempt->exam->title,
                'link' => '/exam-sessions/'.$attempt->id,
                'dueAt' => $attempt->timer_ends_at?->toIso8601String(),
                'priority' => 'high',
            ];
        }

        foreach ($enrollments->where('status', 'active') as $enrollment) {
            $course = $enrollment->course;

            if ($course === null) {
                continue;
            }

            $progress = (int) ($completions->get($enrollment->id)?->completion_percent ?? 0);

            if ($progress >= 100) {
                continue;
            }

            $tasks[] = [
                'id' => 'course-'.$enrollment->id,
                'type' => 'course',
                'title' => $course->title,
                'link' => '/courses/'.$course->slug,
                'dueAt' => $course->end_date?->toIso8601String(),
                'priority' => 'normal',
            ];
        }

        usort($tasks, fn (array $a, array $b): int => ($a['dueAt'] ?? '9999') <=> ($b['dueAt'] ?? '9999'));

        return array_slice($tasks, 0, 10);
    }

    /**
     * @param Collection<int, CourseEnrollment> $enrollments
     * @param Collection<int, LessonProgress> $recentProgress
     * @param Collection<string, CourseCompletion> $completions
     * @param Collection<int, ExamAttempt> $attempts
     * @param Collection<int, IssuedCertificate> $certificates
     *
     * @return list<array<string, mixed>>
     */
    private function timeline(
        Collection $enrollments,
        Collection $recentProgress,
        Collection $completions,
        Collection $attempts,
        Collection $certificates,
    ): array {
        $events = [];

        foreach ($enrollments as $enrollment) {
            $events[] = [
                'id' => 'enrolled-'.$enrollment->id,
                'type' => 'course_enrolled',
                'title' => $enrollment->course?->title ?? '',
                'description' => null,
                'occurredAt' => $enrollment->enrolled_at?->toIso8601String(),
            ];
        }

        foreach ($recentProgress as $progress) {
            $completed = $progress->status === 'completed';

            $events[] = [
                'id' => 'lesson-'.$progress->id,
                'type' => $completed ? 'lesson_completed' : 'lesson_progressed',
                'title' => $progress->lesson?->title ?? '',
                'description' => null,
                'occurredAt' => ($completed ? $progress->completed_at : $progress->last_activity_at)?->toIso8601String(),
            ];
        }

        foreach ($completions as $completion) {
            if ($completion->completed_at === null) {
                continue;
            }

            $events[] = [
                'id' => 'completed-'.$completion->id,
                'type' => 'course_completed',
                'title' => $completion->course?->title ?? '',
                'description' => $completion->completion_percent.'%',
                'occurredAt' => $completion->completed_at?->toIso8601String(),
            ];
        }

        foreach ($attempts as $attempt) {
            $events[] = [
                'id' => 'attempt-'.$attempt->id,
                'type' => $attempt->passed ? 'exam_passed' : 'exam_submitted',
                'title' => $attempt->exam?->title ?? '',
                'description' => $attempt->percentage !== null ? round($attempt->percentage, 1).'%' : null,
                'occurredAt' => $attempt->submitted_at?->toIso8601String(),
            ];
        }

        foreach ($certificates as $certificate) {
            $events[] = [
                'id' => 'certificate-'.$certificate->id,
                'type' => 'certificate_issued',
                'title' => $certificate->course?->title ?? '',
                'description' => $certificate->certificate_number,
                'occurredAt' => $certificate->issued_at?->toIso8601String(),
            ];
        }

        $events = array_values(array_filter(
            $events,
            fn (array $event): bool => $event['occurredAt'] !== null,
        ));

        usort(
            $events,
            fn (array $a, array $b): int => strcmp($b['occurredAt'], $a['occurredAt']),
        );

        return array_slice($events, 0, 12);
    }

    /**
     * @param Collection<string, CourseCompletion> $completions
     * @param Collection<int, ExamAttempt> $attempts
     * @param Collection<int, IssuedCertificate> $certificates
     *
     * @return list<array<string, mixed>>
     */
    private function achievements(Collection $completions, Collection $attempts, Collection $certificates): array
    {
        $achievements = [];

        foreach ($completions as $completion) {
            if ($completion->completed_at === null) {
                continue;
            }

            $achievements[] = [
                'id' => 'course-'.$completion->id,
                'type' => 'course_completed',
                'title' => $completion->course?->title ?? '',
                'description' => $completion->completion_percent.'%',
                'earnedAt' => $completion->completed_at?->toIso8601String(),
            ];
        }

        foreach ($attempts as $attempt) {
            if (! $attempt->passed) {
                continue;
            }

            $achievements[] = [
                'id' => 'exam-'.$attempt->id,
                'type' => 'exam_passed',
                'title' => $attempt->exam?->title ?? '',
                'description' => $attempt->percentage !== null ? round($attempt->percentage, 1).'%' : null,
                'earnedAt' => $attempt->submitted_at?->toIso8601String(),
            ];
        }

        foreach ($certificates as $certificate) {
            $achievements[] = [
                'id' => 'certificate-'.$certificate->id,
                'type' => 'certificate',
                'title' => $certificate->course?->title ?? '',
                'description' => $certificate->certificate_number,
                'earnedAt' => $certificate->issued_at?->toIso8601String(),
            ];
        }

        $achievements = array_values(array_filter(
            $achievements,
            fn (array $item): bool => $item['earnedAt'] !== null,
        ));

        usort($achievements, fn (array $a, array $b): int => strcmp($b['earnedAt'], $a['earnedAt']));

        return array_slice($achievements, 0, 12);
    }

    /**
     * Upcoming deadlines derived from real records: exam timers that are still
     * running and course end dates within the next 30 days.
     *
     * @param Collection<int, CourseEnrollment> $enrollments
     *
     * @return list<array<string, mixed>>
     */
    private function calendar(Collection $enrollments, User $user): array
    {
        $grouped = [];

        $inProgress = ExamAttempt::query()
            ->with('exam')
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->whereNotNull('timer_ends_at')
            ->get();

        $horizon = now()->copy()->addDays(30)->endOfDay();

        foreach ($inProgress as $attempt) {
            $endsAt = $attempt->timer_ends_at;

            if ($endsAt === null || $endsAt->isPast() || $endsAt->greaterThan($horizon)) {
                continue;
            }

            $date = $endsAt->toDateString();

            $grouped[$date][] = [
                'id' => 'exam-'.$attempt->id,
                'type' => 'exam_due',
                'title' => $attempt->exam?->title ?? '',
                'at' => $endsAt->toIso8601String(),
            ];
        }

        foreach ($enrollments->where('status', 'active') as $enrollment) {
            $course = $enrollment->course;

            if ($course === null || $course->end_date === null) {
                continue;
            }

            $endsAt = $course->end_date;

            if ($endsAt->isPast() || $endsAt->greaterThan($horizon)) {
                continue;
            }

            $date = $endsAt->toDateString();

            $grouped[$date][] = [
                'id' => 'course-'.$enrollment->id,
                'type' => 'course_ends',
                'title' => $course->title,
                'at' => $endsAt->toIso8601String(),
            ];
        }

        if ($grouped === []) {
            return [];
        }

        ksort($grouped);

        return collect($grouped)
            ->map(fn (array $items, string $date): array => [
                'date' => $date,
                'items' => $items,
            ])
            ->values()
            ->all();
    }

    /**
     * @param Collection<int, CourseEnrollment> $enrollments
     * @param Collection<int, LessonProgress> $recentProgress
     * @param Collection<int, ExamAttempt> $attempts
     * @param Collection<int, IssuedCertificate> $certificates
     *
     * @return Collection<int, string>
     */
    private function collectActivityDates(
        Collection $enrollments,
        Collection $recentProgress,
        Collection $attempts,
        Collection $certificates,
    ): Collection {
        $dates = collect();

        foreach ($enrollments as $enrollment) {
            if ($enrollment->enrolled_at !== null) {
                $dates->push($enrollment->enrolled_at->toDateString());
            }
        }

        foreach ($recentProgress as $progress) {
            if ($progress->last_activity_at !== null) {
                $dates->push($progress->last_activity_at->toDateString());
            }
        }

        foreach ($attempts as $attempt) {
            if ($attempt->submitted_at !== null) {
                $dates->push($attempt->submitted_at->toDateString());
            }
        }

        foreach ($certificates as $certificate) {
            if ($certificate->issued_at !== null) {
                $dates->push($certificate->issued_at->toDateString());
            }
        }

        return $dates->unique()->sort()->values();
    }

    /**
     * @param Collection<int, string> $dates
     */
    private function currentStreak(Collection $dates): int
    {
        if ($dates->isEmpty()) {
            return 0;
        }

        $days = $dates->map(fn (string $date): int => (int) strtotime($date))->sortDesc()->values();
        $today = (int) strtotime('today');

        $cursor = $days->first() === $today ? $today : ($days->contains($today - 86400) ? $today - 86400 : null);

        if ($cursor === null) {
            return 0;
        }

        $streak = 0;
        $expected = $cursor;

        foreach ($days as $day) {
            if ($day === $expected) {
                $streak++;
                $expected -= 86400;

                continue;
            }

            if ($day < $expected) {
                break;
            }
        }

        return $streak;
    }

    /**
     * @param Collection<int, int> $enrollmentIds
     *
     * @return Collection<int, LessonProgress>
     */
    private function recentLessonProgress(Collection $enrollmentIds): Collection
    {
        if ($enrollmentIds->isEmpty()) {
            return collect();
        }

        return LessonProgress::query()
            ->with('lesson:id,title')
            ->whereIn('course_enrollment_id', $enrollmentIds)
            ->orderByDesc('last_activity_at')
            ->limit(6)
            ->get();
    }

    private function roundOne(mixed $value): float
    {
        return round((float) ($value ?? 0), 1);
    }

    /**
     * Builds a progress-percent map for every eligible enrollment using the
     * persisted completion record when available, otherwise recomputing it
     * from completed lesson progress records.
     *
     * @param Collection<int, CourseEnrollment> $enrollments
     * @param Collection<string, CourseCompletion> $completions
     *
     * @return array<int, int>
     */
    private function progressByEnrollment(Collection $enrollments, Collection $completions): array
    {
        $eligible = $enrollments->where('status', '!==', 'cancelled');

        if ($eligible->isEmpty()) {
            return [];
        }

        $courseIds = $eligible->pluck('course_id')->unique();
        $enrollmentIds = $eligible->pluck('id');

        $totalLessonsByCourse = CourseLesson::query()
            ->whereIn('course_id', $courseIds)
            ->selectRaw('course_id, COUNT(*) as total')
            ->groupBy('course_id')
            ->pluck('total', 'course_id');

        $completedByEnrollment = LessonProgress::query()
            ->whereIn('course_enrollment_id', $enrollmentIds)
            ->where('status', 'completed')
            ->selectRaw('course_enrollment_id, COUNT(*) as total')
            ->groupBy('course_enrollment_id')
            ->pluck('total', 'course_enrollment_id');

        $progress = [];

        foreach ($eligible as $enrollment) {
            $percent = $completions->get($enrollment->id)?->completion_percent;

            if ($percent === null) {
                $total = (int) ($totalLessonsByCourse->get($enrollment->course_id) ?? 0);
                $completed = (int) ($completedByEnrollment->get($enrollment->id) ?? 0);
                $percent = $total > 0 ? (int) floor(($completed / $total) * 100) : 0;
            }

            $progress[$enrollment->id] = (int) $percent;
        }

        return $progress;
    }

    /**
     * @param Collection<int, CourseEnrollment> $enrollments
     * @param array<int, int> $progressByEnrollment
     */
    private function completedCount(Collection $enrollments, array $progressByEnrollment): int
    {
        $count = 0;

        foreach ($enrollments as $enrollment) {
            if (($progressByEnrollment[$enrollment->id] ?? 0) >= 100) {
                $count++;
            }
        }

        return $count;
    }
}
