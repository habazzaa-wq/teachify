<?php

namespace App\Services\ExamBank;

use App\Models\CourseLesson;
use App\Models\ExamAttempt;
use App\Models\User;
use App\Services\Access\AccessEvaluationService;

class ExamEntryService
{
    public function __construct(private readonly AccessEvaluationService $access) {}

    /**
     * @return array<string, mixed>
     */
    public function entry(User $user, CourseLesson $lesson): array
    {
        $tenant = currentTenant();
        $exam = $lesson->exam;

        if (! $exam || $exam->tenant_id !== $tenant->id) {
            return $this->noExam();
        }

        $attempts = ExamAttempt::query()
            ->where('tenant_id', $tenant->id)
            ->where('exam_id', $exam->id)
            ->where('user_id', $user->id)
            ->get(['id', 'status', 'score', 'max_score', 'passed', 'started_at', 'submitted_at']);

        $submitted = $attempts->where('status', 'submitted');
        $passed = $submitted->where('passed', true);

        $previousAttempts = $attempts->count();
        $bestScore = $submitted
            ->filter(fn (ExamAttempt $attempt): bool => (float) $attempt->max_score > 0)
            ->map(fn (ExamAttempt $attempt): float => (float) $attempt->score / (float) $attempt->max_score * 100)
            ->max();

        $maxAttempts = $exam->attempt_limit;
        $remainingAttempts = $maxAttempts === null
            ? null
            : max(0, $maxAttempts - $previousAttempts);

        $published = $exam->status === 'published';
        $hasQuestions = $exam->question_count > 0;
        $lessonAccessible = $this->access->canAccessLesson($user, $lesson);
        $completed = $passed->isNotEmpty();
        $exhausted = $remainingAttempts !== null && $remainingAttempts <= 0;

        if (! $published || ! $hasQuestions) {
            [$eligibility, $lockedReason] = ['unavailable', $published ? 'no_questions' : 'exam_not_published'];
        } elseif ($completed) {
            [$eligibility, $lockedReason] = ['completed', null];
        } elseif ($lessonAccessible && ! $exhausted) {
            [$eligibility, $lockedReason] = ['available', null];
        } elseif (! $lessonAccessible) {
            [$eligibility, $lockedReason] = ['locked', 'lesson_locked'];
        } else {
            [$eligibility, $lockedReason] = ['locked', 'max_attempts_reached'];
        }

        return [
            'examExists' => true,
            'examId' => (string) $exam->id,
            'examTitle' => $exam->title,
            'description' => $exam->description,
            'duration' => $exam->duration,
            'passingPercentage' => $exam->passing_score,
            'questionCount' => $exam->question_count,
            'maxAttempts' => $maxAttempts,
            'previousAttempts' => $previousAttempts,
            'remainingAttempts' => $remainingAttempts,
            'bestScore' => $bestScore === null ? null : round((float) $bestScore, 1),
            'eligibility' => $eligibility,
            'lockedReason' => $lockedReason,
            'canStart' => $eligibility === 'available',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function noExam(): array
    {
        return [
            'examExists' => false,
            'examId' => null,
            'examTitle' => null,
            'description' => null,
            'duration' => null,
            'passingPercentage' => null,
            'questionCount' => null,
            'maxAttempts' => null,
            'previousAttempts' => 0,
            'remainingAttempts' => null,
            'bestScore' => null,
            'eligibility' => 'unavailable',
            'lockedReason' => 'no_exam',
            'canStart' => false,
        ];
    }
}
