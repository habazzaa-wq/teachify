<?php

namespace App\Services\ExamBank;

use App\Models\CourseLesson;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Question;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Phase 3 — Results & Review.
 *
 * Builds the read-only post-submission payload for a single attempt (score,
 * statistics, per-question review), the student's attempt history for an exam,
 * and the comparison data a practice attempt shows against its source attempt.
 *
 * It never writes to the attempt; grading is delegated to ExamGradingService so
 * the exact same engine that scored the attempt is reused.
 */
class ExamResultService
{
    public function __construct(
        private readonly ExamGradingService $grading,
        private readonly ExamAnswerGrader $grader,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function result(User $user, ExamAttempt $attempt): array
    {
        $this->ensureOwnedByUser($attempt, $user);

        if ($attempt->status === 'in_progress') {
            if ($this->isExpired($attempt)) {
                $attempt = $this->grading->grade($attempt);
            } else {
                throw ValidationException::withMessages([
                    'attempt' => ['This attempt has not been submitted yet.'],
                ]);
            }
        }

        $exam = $attempt->exam()->firstOrFail();
        $examQuestions = $this->grading->questionsForAttempt($attempt, $exam);
        $answers = $attempt->answers()->get()->keyBy('exam_question_id');
        $revealCorrect = $exam->show_correct_answers;

        $review = [];
        $correctCount = 0;
        $wrongCount = 0;
        $skippedCount = 0;
        $totalPoints = 0;
        $earnedPoints = 0;

        foreach ($examQuestions as $examQuestion) {
            $question = $examQuestion->question;
            $saved = $answers->get($examQuestion->id);
            $answered = $saved !== null;
            $points = max(0, (int) ($examQuestion->points ?? $question?->points ?? 0));
            $totalPoints += $points;

            $isCorrect = $answered && $this->grader->grade($question, $saved->answer);

            if ($isCorrect) {
                $correctCount++;
                $earnedPoints += $points;
            } elseif ($answered) {
                $wrongCount++;
            } else {
                $skippedCount++;
            }

            $review[] = [
                'examQuestionId' => (string) $examQuestion->id,
                'questionId' => (string) $question->id,
                'type' => $question->type,
                'title' => $question->title,
                'description' => $question->description,
                'points' => $points,
                'order' => (int) $examQuestion->order,
                'section' => $examQuestion->section,
                'difficulty' => $question->difficulty,
                'tags' => $question->tags ?? [],
                'content' => $this->contentForReview($question, $revealCorrect),
                'studentAnswer' => $saved?->answer,
                'correctAnswer' => $revealCorrect ? $this->correctAnswerFor($question) : null,
                'explanation' => $revealCorrect ? $question->explanation : null,
                'isCorrect' => $answered ? $isCorrect : null,
                'answered' => $answered,
                'status' => $answered ? ($isCorrect ? 'correct' : 'wrong') : 'skipped',
                'earnedPoints' => $isCorrect ? $points : 0,
            ];
        }

        $answeredCount = $correctCount + $wrongCount;
        $questionCount = count($review);

        return [
            'attempt' => [
                'id' => (string) $attempt->id,
                'examId' => (string) $exam->id,
                'status' => $attempt->status,
                'isOfficial' => $attempt->is_official,
                'isPractice' => $attempt->is_practice,
                'score' => (float) $attempt->score,
                'maxScore' => (float) $attempt->max_score,
                'percentage' => $attempt->percentage !== null ? (float) $attempt->percentage : null,
                'passed' => $attempt->passed,
                'durationSeconds' => $attempt->duration_seconds,
                'attemptNumber' => $this->attemptNumber($attempt, $user),
                'startedAt' => $attempt->started_at?->toIso8601String(),
                'submittedAt' => $attempt->submitted_at?->toIso8601String(),
            ],
            'exam' => [
                'id' => (string) $exam->id,
                'title' => $exam->title,
                'description' => $exam->description,
                'duration' => $exam->duration,
                'passingScore' => (int) $exam->passing_score,
                'totalPoints' => (int) $exam->total_points,
                'questionCount' => (int) $exam->question_count,
                'showResults' => $exam->show_results,
                'showCorrectAnswers' => $exam->show_correct_answers,
                'allowReview' => $exam->allow_review,
                'certificateEligible' => $exam->certificate_eligible,
            ],
            'course' => $this->courseForExam($exam),
            'statistics' => [
                'totalQuestions' => $questionCount,
                'answeredQuestions' => $answeredCount,
                'correctAnswers' => $correctCount,
                'wrongAnswers' => $wrongCount,
                'skippedQuestions' => $skippedCount,
                'correctPercent' => $this->percent($correctCount, $questionCount),
                'wrongPercent' => $this->percent($wrongCount, $questionCount),
                'skippedPercent' => $this->percent($skippedCount, $questionCount),
                'accuracy' => $this->percent($correctCount, $answeredCount),
                'completionRate' => $this->percent($answeredCount, $questionCount),
                'averageSecondsPerQuestion' => $answeredCount > 0 && $attempt->duration_seconds !== null
                    ? round($attempt->duration_seconds / $answeredCount, 1)
                    : null,
                'questionsPerMinute' => $answeredCount > 0 && $attempt->duration_seconds !== null && $attempt->duration_seconds > 0
                    ? round($answeredCount / ($attempt->duration_seconds / 60), 1)
                    : null,
                'earnedPoints' => $earnedPoints,
                'totalPoints' => $totalPoints,
                'durationSeconds' => $attempt->duration_seconds,
            ],
            'flags' => [
                'canReview' => $exam->show_results && $exam->show_correct_answers,
                'showCorrectAnswers' => $revealCorrect,
                'canPractice' => $wrongCount > 0,
                'certificateEligible' => $attempt->passed && $exam->certificate_eligible,
            ],
            'practiceSource' => $this->practiceSource($attempt),
            'review' => $review,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function history(User $user, Exam $exam): array
    {
        if ($exam->tenant_id !== currentTenant()->id) {
            abort(404);
        }

        $attempts = ExamAttempt::query()
            ->where('exam_id', $exam->id)
            ->where('user_id', $user->id)
            ->orderBy('id')
            ->get(['id', 'score', 'max_score', 'percentage', 'passed', 'is_official', 'is_practice', 'status', 'duration_seconds', 'started_at', 'submitted_at']);

        $items = $attempts->values()
            ->map(fn (ExamAttempt $attempt, int $index): array => [
                'attemptId' => (string) $attempt->id,
                'attemptNumber' => $index + 1,
                'isOfficial' => $attempt->is_official,
                'isPractice' => $attempt->is_practice,
                'score' => (float) $attempt->score,
                'maxScore' => (float) $attempt->max_score,
                'percentage' => $attempt->percentage !== null ? (float) $attempt->percentage : null,
                'passed' => $attempt->passed,
                'status' => $attempt->status,
                'durationSeconds' => $attempt->duration_seconds,
                'startedAt' => $attempt->started_at?->toIso8601String(),
                'submittedAt' => $attempt->submitted_at?->toIso8601String(),
            ])
            ->all();

        return [
            'examId' => (string) $exam->id,
            'examTitle' => $exam->title,
            'attempts' => $items,
        ];
    }

    private function isExpired(ExamAttempt $attempt): bool
    {
        return $attempt->timer_ends_at !== null && now()->greaterThanOrEqualTo($attempt->timer_ends_at);
    }

    private function ensureOwnedByUser(ExamAttempt $attempt, User $user): void
    {
        if ($attempt->tenant_id !== currentTenant()->id || $attempt->user_id !== $user->id) {
            abort(404);
        }
    }

    private function attemptNumber(ExamAttempt $attempt, User $user): int
    {
        return (int) ExamAttempt::query()
            ->where('exam_id', $attempt->exam_id)
            ->where('user_id', $user->id)
            ->where('id', '<=', $attempt->id)
            ->count();
    }

    /**
     * @return array<string, mixed>|null
     */
    private function practiceSource(ExamAttempt $attempt): ?array
    {
        if ($attempt->practice_source_attempt_id === null) {
            return null;
        }

        $source = ExamAttempt::query()->find($attempt->practice_source_attempt_id);

        if ($source === null) {
            return null;
        }

        return [
            'attemptId' => (string) $source->id,
            'score' => (float) $source->score,
            'maxScore' => (float) $source->max_score,
            'percentage' => $source->percentage !== null ? (float) $source->percentage : null,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function courseForExam(Exam $exam): ?array
    {
        $lesson = CourseLesson::query()
            ->where('exam_id', $exam->id)
            ->with(['course:id,title,slug'])
            ->first();

        if ($lesson === null || $lesson->course === null) {
            return null;
        }

        return [
            'id' => (string) $lesson->course->id,
            'title' => $lesson->course->title,
            'slug' => $lesson->course->slug,
        ];
    }

    /**
     * Sanitizes question content for review. Correct options are only revealed
     * when the exam allows showing correct answers.
     *
     * @return array<string, mixed>
     */
    private function contentForReview(Question $question, bool $revealCorrect): array
    {
        $content = $question->content ?? [];

        return match ($question->type) {
            'single_choice', 'multiple_choice' => [
                'options' => collect($content['options'] ?? [])
                    ->map(fn (array $option): array => $revealCorrect
                        ? [
                            'id' => (string) ($option['id'] ?? ''),
                            'text' => $option['text'] ?? '',
                            'correct' => (bool) ($option['correct'] ?? false),
                        ]
                        : [
                            'id' => (string) ($option['id'] ?? ''),
                            'text' => $option['text'] ?? '',
                        ])
                    ->values()
                    ->all(),
            ],
            'true_false' => $revealCorrect && isset($content['correct'])
                ? ['correct' => (string) $content['correct']]
                : [],
            'numeric' => array_filter([
                'tolerance' => (int) ($content['tolerance'] ?? 0),
                'correct' => $revealCorrect && isset($content['correct'])
                    ? (string) $content['correct']
                    : null,
            ], fn (mixed $value): bool => $value !== null),
            default => [],
        };
    }

    /**
     * @return list<string>|string|null
     */
    private function correctAnswerFor(Question $question): array|string|null
    {
        $content = $question->content ?? [];

        return match ($question->type) {
            'single_choice', 'multiple_choice' => collect($content['options'] ?? [])
                ->filter(fn (array $option): bool => (bool) ($option['correct'] ?? false))
                ->map(fn (array $option): string => (string) ($option['id'] ?? ''))
                ->sort()
                ->values()
                ->all(),
            'true_false' => isset($content['correct']) ? (string) $content['correct'] : null,
            'numeric' => isset($content['correct']) && is_numeric($content['correct'])
                ? (string) $content['correct']
                : null,
            default => null,
        };
    }

    private function percent(int $part, int $total): float
    {
        if ($total <= 0) {
            return 0.0;
        }

        return round($part / $total * 100, 1);
    }
}
