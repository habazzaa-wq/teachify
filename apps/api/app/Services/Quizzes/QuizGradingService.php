<?php

namespace App\Services\Quizzes;

use App\Models\CourseEnrollment;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use App\Models\QuizQuestion;
use App\Models\QuizResult;
use App\Services\Learning\CompletionService;
use App\Services\Notifications\NotificationEventService;
use Illuminate\Validation\ValidationException;

class QuizGradingService
{
    public function __construct(
        private readonly CompletionService $completions,
        private readonly NotificationEventService $notificationEvents,
    )
    {
    }

    /**
     * @param list<array{quiz_question_id:int,selected_option_ids:list<int>}> $answers
     */
    public function grade(Quiz $quiz, QuizAttempt $attempt, array $answers): QuizAttempt
    {
        $questions = $quiz->questions()->with('options')->get();

        if ($questions->isEmpty()) {
            throw ValidationException::withMessages([
                'quiz' => ['A quiz must have questions before it can be graded.'],
            ]);
        }

        $answerMap = collect($answers)->keyBy('quiz_question_id');
        $totalPoints = max(1, (int) $questions->sum('points'));
        $earnedPoints = 0;

        $attempt->answers()->delete();

        foreach ($questions as $question) {
            $answer = $answerMap->get($question->id);

            if (! $answer) {
                throw ValidationException::withMessages([
                    'answers' => ['Every quiz question must have an answer.'],
                ]);
            }

            $selectedIds = collect($answer['selected_option_ids'] ?? [])
                ->map(fn ($id): int => (int) $id)
                ->unique()
                ->sort()
                ->values()
                ->all();

            $this->validateSelectedOptions($question, $selectedIds);

            $correctIds = $question->options
                ->where('is_correct', true)
                ->pluck('id')
                ->map(fn ($id): int => (int) $id)
                ->sort()
                ->values()
                ->all();

            $isCorrect = $selectedIds === $correctIds;
            $questionPoints = $isCorrect ? $question->points : 0;
            $earnedPoints += $questionPoints;

            QuizAttemptAnswer::create([
                'tenant_id' => $attempt->tenant_id,
                'quiz_attempt_id' => $attempt->id,
                'quiz_question_id' => $question->id,
                'selected_option_ids' => $selectedIds,
                'is_correct' => $isCorrect,
                'earned_points' => $questionPoints,
            ]);
        }

        $score = (int) floor(($earnedPoints / $totalPoints) * 100);
        $passed = $score >= $quiz->passing_score;

        $attempt->forceFill([
            'submitted_at' => now(),
            'status' => 'graded',
            'score' => $score,
        ])->save();

        $this->updateResult($quiz, $attempt, $score, $passed);

        $this->notificationEvents->record($quiz->course->tenant, $passed ? 'quiz.passed' : 'quiz.failed', 'quiz-attempt-'.$attempt->id, [
            'tenant_user_id' => $attempt->tenant_user_id,
            'quiz_id' => $quiz->id,
            'quiz_title' => $quiz->title,
            'score' => $score,
        ]);

        if ($passed) {
            $this->synchronizeCompletion($quiz, $attempt);
        }

        return $attempt->refresh()->load('answers');
    }

    /**
     * @param list<int> $selectedIds
     */
    private function validateSelectedOptions(QuizQuestion $question, array $selectedIds): void
    {
        if ($selectedIds === []) {
            throw ValidationException::withMessages([
                'answers' => ['Every quiz question must include at least one selected option.'],
            ]);
        }

        if (in_array($question->type, ['single_choice', 'true_false'], true) && count($selectedIds) !== 1) {
            throw ValidationException::withMessages([
                'answers' => ['Single choice and true/false answers must select exactly one option.'],
            ]);
        }

        $validOptionIds = $question->options->pluck('id')->map(fn ($id): int => (int) $id)->all();

        if (array_diff($selectedIds, $validOptionIds) !== []) {
            throw ValidationException::withMessages([
                'answers' => ['One or more selected options are invalid for the question.'],
            ]);
        }
    }

    private function updateResult(Quiz $quiz, QuizAttempt $attempt, int $score, bool $passed): QuizResult
    {
        $result = QuizResult::query()
            ->where('quiz_id', $quiz->id)
            ->where('tenant_user_id', $attempt->tenant_user_id)
            ->first();

        if (! $result) {
            return QuizResult::create([
                'tenant_id' => $quiz->tenant_id,
                'quiz_id' => $quiz->id,
                'tenant_user_id' => $attempt->tenant_user_id,
                'best_score' => $score,
                'passed' => $passed,
                'completed_at' => $passed ? now() : null,
            ]);
        }

        $result->forceFill([
            'best_score' => max($result->best_score, $score),
            'passed' => $result->passed || $passed,
            'completed_at' => $result->completed_at ?? ($passed ? now() : null),
        ])->save();

        return $result->refresh();
    }

    private function synchronizeCompletion(Quiz $quiz, QuizAttempt $attempt): void
    {
        $enrollment = CourseEnrollment::query()
            ->where('course_id', $quiz->course_id)
            ->where('tenant_user_id', $attempt->tenant_user_id)
            ->whereIn('status', ['active', 'completed'])
            ->first();

        if ($enrollment) {
            $this->completions->synchronize($enrollment);
        }
    }
}
