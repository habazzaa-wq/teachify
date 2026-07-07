<?php

namespace App\Services\Analytics;

use App\Models\Assignment;
use App\Models\AssignmentAnalytics;
use App\Models\AssignmentResult;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\CourseAnalytics;
use App\Models\CourseCompletion;
use App\Models\CourseEnrollment;
use App\Models\LearnerAnalytics;
use App\Models\LessonProgress;
use App\Models\MediaAsset;
use App\Models\Quiz;
use App\Models\QuizAnalytics;
use App\Models\QuizAttempt;
use App\Models\QuizResult;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\VideoAnalytics;
use App\Models\VideoPlaybackSession;

class AnalyticsAggregationService
{
    public function aggregateTenant(Tenant $tenant): void
    {
        $this->bindTenant($tenant);

        Course::query()
            ->where('tenant_id', $tenant->id)
            ->each(fn (Course $course) => $this->aggregateCourse($course));

        TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->each(fn (TenantUser $learner) => $this->aggregateLearner($learner));

        Quiz::query()
            ->where('tenant_id', $tenant->id)
            ->each(fn (Quiz $quiz) => $this->aggregateQuiz($quiz));

        Assignment::query()
            ->where('tenant_id', $tenant->id)
            ->each(fn (Assignment $assignment) => $this->aggregateAssignment($assignment));

        MediaAsset::query()
            ->where('tenant_id', $tenant->id)
            ->where('type', 'video')
            ->each(fn (MediaAsset $asset) => $this->aggregateVideo($asset));
    }

    public function aggregateCourse(Course $course): CourseAnalytics
    {
        $this->bindTenantById($course->tenant_id);

        $enrollmentsCount = CourseEnrollment::query()
            ->where('tenant_id', $course->tenant_id)
            ->where('course_id', $course->id)
            ->count();

        $activeLearnersCount = CourseEnrollment::query()
            ->where('tenant_id', $course->tenant_id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->count();

        $completedLearnersCount = CourseCompletion::query()
            ->where('tenant_id', $course->tenant_id)
            ->where('course_id', $course->id)
            ->whereNotNull('completed_at')
            ->count();

        $averageProgress = CourseCompletion::query()
            ->where('tenant_id', $course->tenant_id)
            ->where('course_id', $course->id)
            ->avg('completion_percent');

        if ($averageProgress === null) {
            $averageProgress = LessonProgress::query()
                ->where('tenant_id', $course->tenant_id)
                ->where('course_id', $course->id)
                ->avg('progress_percent');
        }

        $quizIds = Quiz::query()
            ->where('tenant_id', $course->tenant_id)
            ->where('course_id', $course->id)
            ->pluck('id');

        $assignmentIds = Assignment::query()
            ->where('tenant_id', $course->tenant_id)
            ->where('course_id', $course->id)
            ->pluck('id');

        return CourseAnalytics::updateOrCreate(
            [
                'tenant_id' => $course->tenant_id,
                'course_id' => $course->id,
            ],
            [
                'enrollments_count' => $enrollmentsCount,
                'active_learners_count' => $activeLearnersCount,
                'completed_learners_count' => $completedLearnersCount,
                'completion_rate' => $this->percent($completedLearnersCount, $enrollmentsCount),
                'average_progress_percent' => $this->number($averageProgress),
                'average_quiz_score' => $this->number(QuizResult::query()
                    ->where('tenant_id', $course->tenant_id)
                    ->whereIn('quiz_id', $quizIds)
                    ->avg('best_score')),
                'average_assignment_score' => $this->number(AssignmentResult::query()
                    ->where('tenant_id', $course->tenant_id)
                    ->whereIn('assignment_id', $assignmentIds)
                    ->avg('score')),
                'generated_at' => now(),
            ],
        )->refresh();
    }

    public function aggregateLearner(TenantUser $learner): LearnerAnalytics
    {
        $this->bindTenantById($learner->tenant_id);

        $enrolledCoursesCount = CourseEnrollment::query()
            ->where('tenant_id', $learner->tenant_id)
            ->where('tenant_user_id', $learner->id)
            ->count();

        $completedCoursesCount = CourseCompletion::query()
            ->where('tenant_id', $learner->tenant_id)
            ->whereHas('enrollment', fn ($query) => $query->where('tenant_user_id', $learner->id))
            ->whereNotNull('completed_at')
            ->count();

        return LearnerAnalytics::updateOrCreate(
            [
                'tenant_id' => $learner->tenant_id,
                'tenant_user_id' => $learner->id,
            ],
            [
                'enrolled_courses_count' => $enrolledCoursesCount,
                'completed_courses_count' => $completedCoursesCount,
                'average_progress_percent' => $this->number(CourseCompletion::query()
                    ->where('tenant_id', $learner->tenant_id)
                    ->whereHas('enrollment', fn ($query) => $query->where('tenant_user_id', $learner->id))
                    ->avg('completion_percent')),
                'average_quiz_score' => $this->number(QuizResult::query()
                    ->where('tenant_id', $learner->tenant_id)
                    ->where('tenant_user_id', $learner->id)
                    ->avg('best_score')),
                'average_assignment_score' => $this->number(AssignmentResult::query()
                    ->where('tenant_id', $learner->tenant_id)
                    ->where('tenant_user_id', $learner->id)
                    ->avg('score')),
                'last_activity_at' => LessonProgress::query()
                    ->where('tenant_id', $learner->tenant_id)
                    ->whereHas('enrollment', fn ($query) => $query->where('tenant_user_id', $learner->id))
                    ->max('last_activity_at'),
                'generated_at' => now(),
            ],
        )->refresh();
    }

    public function aggregateQuiz(Quiz $quiz): QuizAnalytics
    {
        $this->bindTenantById($quiz->tenant_id);

        $attemptCount = QuizAttempt::query()
            ->where('tenant_id', $quiz->tenant_id)
            ->where('quiz_id', $quiz->id)
            ->count();

        $passedCount = QuizResult::query()
            ->where('tenant_id', $quiz->tenant_id)
            ->where('quiz_id', $quiz->id)
            ->where('passed', true)
            ->count();

        return QuizAnalytics::updateOrCreate(
            [
                'tenant_id' => $quiz->tenant_id,
                'quiz_id' => $quiz->id,
            ],
            [
                'attempt_count' => $attemptCount,
                'unique_learners' => QuizAttempt::query()
                    ->where('tenant_id', $quiz->tenant_id)
                    ->where('quiz_id', $quiz->id)
                    ->distinct('tenant_user_id')
                    ->count('tenant_user_id'),
                'average_score' => $this->number(QuizResult::query()
                    ->where('tenant_id', $quiz->tenant_id)
                    ->where('quiz_id', $quiz->id)
                    ->avg('best_score')),
                'pass_rate' => $this->percent($passedCount, max(1, QuizResult::query()
                    ->where('tenant_id', $quiz->tenant_id)
                    ->where('quiz_id', $quiz->id)
                    ->count())),
                'generated_at' => now(),
            ],
        )->refresh();
    }

    public function aggregateAssignment(Assignment $assignment): AssignmentAnalytics
    {
        $this->bindTenantById($assignment->tenant_id);

        return AssignmentAnalytics::updateOrCreate(
            [
                'tenant_id' => $assignment->tenant_id,
                'assignment_id' => $assignment->id,
            ],
            [
                'submission_count' => AssignmentSubmission::query()
                    ->where('tenant_id', $assignment->tenant_id)
                    ->where('assignment_id', $assignment->id)
                    ->count(),
                'graded_count' => AssignmentResult::query()
                    ->where('tenant_id', $assignment->tenant_id)
                    ->where('assignment_id', $assignment->id)
                    ->whereNotNull('graded_at')
                    ->count(),
                'average_score' => $this->number(AssignmentResult::query()
                    ->where('tenant_id', $assignment->tenant_id)
                    ->where('assignment_id', $assignment->id)
                    ->avg('score')),
                'generated_at' => now(),
            ],
        )->refresh();
    }

    public function aggregateVideo(MediaAsset $asset): VideoAnalytics
    {
        $this->bindTenantById($asset->tenant_id);

        $playCount = VideoPlaybackSession::query()
            ->where('tenant_id', $asset->tenant_id)
            ->where('media_asset_id', $asset->id)
            ->count();

        $watchTime = (int) VideoPlaybackSession::query()
            ->where('tenant_id', $asset->tenant_id)
            ->where('media_asset_id', $asset->id)
            ->sum('last_position_seconds');

        return VideoAnalytics::updateOrCreate(
            [
                'tenant_id' => $asset->tenant_id,
                'media_asset_id' => $asset->id,
            ],
            [
                'play_count' => $playCount,
                'unique_viewers' => VideoPlaybackSession::query()
                    ->where('tenant_id', $asset->tenant_id)
                    ->where('media_asset_id', $asset->id)
                    ->distinct('tenant_user_id')
                    ->count('tenant_user_id'),
                'watch_time_seconds' => $watchTime,
                'average_watch_time_seconds' => $playCount > 0 ? round($watchTime / $playCount, 2) : 0,
                'generated_at' => now(),
            ],
        )->refresh();
    }

    private function percent(int|float $part, int|float $total): float
    {
        return $total > 0 ? round(($part / $total) * 100, 2) : 0.0;
    }

    private function number(mixed $value): float
    {
        return round((float) ($value ?? 0), 2);
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }

    private function bindTenantById(int $tenantId): void
    {
        $this->bindTenant(Tenant::query()->findOrFail($tenantId));
    }
}
