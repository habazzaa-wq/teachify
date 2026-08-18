<?php

namespace App\Services\ExamBank;

use App\Models\Exam;
use App\Models\ExamAttempt;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Grades an exam attempt exactly once: scores every saved answer, computes the
 * final percentage, pass/fail state and persists the submission. Idempotent by
 * design — calling it on an attempt that is no longer in-progress is a no-op.
 */
class ExamGradingService
{
    public function __construct(private readonly ExamAnswerGrader $grader) {}

    public function grade(ExamAttempt $attempt): ExamAttempt
    {
        return DB::transaction(function () use ($attempt): ExamAttempt {
            $attempt = ExamAttempt::query()->lockForUpdate()->find($attempt->id) ?? $attempt;

            if ($attempt->status !== 'in_progress') {
                return $attempt;
            }

            $exam = $attempt->exam()->firstOrFail();
            $examQuestions = $this->questionsForAttempt($attempt, $exam);

            if ($examQuestions->isEmpty()) {
                throw ValidationException::withMessages([
                    'exam' => ['The exam has no questions and cannot be graded.'],
                ]);
            }

            $answers = $attempt->answers()->get()->keyBy('exam_question_id');
            $totalPoints = 0;
            $earnedPoints = 0;

            foreach ($examQuestions as $examQuestion) {
                $points = max(0, (int) ($examQuestion->points ?? $examQuestion->question?->points ?? 0));
                $totalPoints += $points;

                $saved = $answers->get($examQuestion->id);

                if ($saved === null) {
                    continue;
                }

                $isCorrect = $this->grader->grade($examQuestion->question, $saved->answer);
                $earnedPoints += $isCorrect ? $points : 0;

                if ($saved->is_correct !== $isCorrect || (int) $saved->earned_points !== $points) {
                    $saved->forceFill([
                        'is_correct' => $isCorrect,
                        'earned_points' => $isCorrect ? $points : 0,
                    ])->save();
                }
            }

            $percentage = $totalPoints > 0 ? round($earnedPoints / $totalPoints * 100, 2) : 0;
            $submittedAt = now();

            $attempt->forceFill([
                'score' => $earnedPoints,
                'max_score' => $totalPoints,
                'percentage' => $percentage,
                'passed' => $percentage >= (int) $exam->passing_score,
                'status' => 'submitted',
                'submitted_at' => $submittedAt,
                'duration_seconds' => $this->computeDuration($attempt, $submittedAt),
            ])->save();

            return $attempt->refresh()->load('answers');
        });
    }

    /**
     * Resolve the ordered questions that belong to an attempt.
     *
     * Practice attempts (and only practice attempts) record an explicit subset of
     * exam question ids in `included_exam_question_ids`; every other attempt uses
     * the full exam question set. The subset is preserved in the DB, so a session
     * resumes and grades the exact same question list regardless of later edits.
     *
     * @return Collection<int, \App\Models\ExamQuestion>
     */
    public function questionsForAttempt(ExamAttempt $attempt, ?Exam $exam = null): Collection
    {
        $exam ??= $attempt->exam()->firstOrFail();

        $questions = $exam->examQuestions()->with(['question', 'question.scan'])->orderBy('order')->get();

        $included = $attempt->included_exam_question_ids;

        if (is_array($included) && $included !== []) {
            $ids = array_map('strval', $included);

            $questions = $questions
                ->filter(fn (object $examQuestion): bool => in_array((string) $examQuestion->id, $ids, true))
                ->values();
        }

        return $questions;
    }

    private function computeDuration(ExamAttempt $attempt, CarbonInterface $submittedAt): ?int
    {
        if ($attempt->started_at === null) {
            return null;
        }

        $end = $attempt->timer_ends_at !== null && $submittedAt->greaterThan($attempt->timer_ends_at)
            ? $attempt->timer_ends_at
            : $submittedAt;

        return max(0, (int) $end->diffInSeconds($attempt->started_at));
    }
}
