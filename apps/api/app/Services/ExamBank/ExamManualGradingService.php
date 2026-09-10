<?php

namespace App\Services\ExamBank;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamAttemptAnswer;
use App\Models\TenantUser;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

/**
 * Teacher manual grading of essay / short_answer answers (Phase E).
 *
 * One save = ONE transaction around the entire read-modify-write, per
 * PHASE_B1_RECALCULATION.md §4.3:
 *
 *   1. `lockForUpdate()`s the `ExamAttempt` row FIRST — before any read of the
 *      attempt's current `score`/`max_score` or its answers;
 *   2. loads the (attempt, answer) pairing and the answer's grading guards
 *      under that lock;
 *   3. writes `manual_score` / `feedback` / `graded_by` / `graded_at` and flips
 *      `grading_status -> 'graded'` (re-grading an already-graded answer is
 *      allowed — B1 §7 "Regrade");
 *   4. recomputes `score` / `max_score` / `percentage` / `passed` from the
 *      locked attempt's full answer set per B1 §3;
 *   5. commits.
 *
 * Two graders saving different answers of the SAME attempt serialize on the
 * attempt row lock, so the second transaction recomputes from the first's
 * committed totals instead of a stale pre-lock read (B1 §4).
 *
 * Authorization lives at the controller (ExamPolicy::update on the owning
 * exam, the exact Phase C teacher gate); this service enforces the DATA-level
 * invariants every caller must pass: tenant, attempt-answer binding, question
 * type and grading state.
 */
class ExamManualGradingService
{
    /**
     * Types that can never be auto-scored and go through teacher review.
     * Mirrors ExamAnswerGrader::grade() ("essay, short_answer => false") and
     * ExamSessionService::MANUALLY_GRADED_QUESTION_TYPES.
     */
    private const MANUALLY_GRADED_QUESTION_TYPES = ['essay', 'short_answer'];

    /**
     * States an answer can be in when a teacher saves a grade. Includes
     * `graded` so a re-grade (B1 §7) replaces the previous teacher award; the
     * one excluded state (`auto_graded`) is the MCQ-style path that is never
     * manually scored.
     */
    private const RE_GRADABLE_STATUSES = ['pending_manual_review', 'partially_graded', 'graded'];

    private const PENDING_REVIEW_STATUSES = ['pending_manual_review', 'partially_graded'];

    public function __construct(private readonly ExamGradingService $grading) {}

    /**
     * Save a manual grade for one answer, then recompute the attempt totals in
     * the same transaction.
     *
     * @param  array{manual_score: float|int|string, feedback?: ?string}  $data
     * @return array{answer: ExamAttemptAnswer, attempt: ExamAttempt}
     */
    public function gradeAnswer(TenantUser $grader, ExamAttempt $attempt, ExamAttemptAnswer $answer, array $data): array
    {
        if ($answer->exam_attempt_id !== $attempt->id) {
            abort(404);
        }

        return DB::transaction(function () use ($grader, $attempt, $answer, $data): array {
            // (1) Lock wraps BOTH the read of current attempt state and the
            // write of the recomputed totals (B1 §4.2). The row is locked
            // before ANY read of score/max_score or the answers below.
            $locked = ExamAttempt::query()->lockForUpdate()->find($attempt->id) ?? abort(404);

            // (1b) Only a finalized attempt is gradeable. Reuses the exact
            // "still answerable" status set ExamGradingService::grade() gates
            // its submit-time recompute on (ExamGradingService.php:36):
            // 'in_progress' / 'grading' are pre-submission states whose later
            // grade() would recompute from scratch and overwrite this award.
            //
            // Attempts that got STUCK before finalization are still gradeable:
            //  - "grading" was already claimed for submission (student submit or
            //    expiry reconcile) and is frozen — the student can no longer
            //    answer, only the queued grade() is pending;
            //  - an expired "in_progress" attempt is over — every session write
            //    reconciles it to "grading"/"submitted".
            // In both cases this transaction finalizes the attempt (below) so
            // the pending grade() becomes a no-op and can never overwrite the
            // award. Only a genuinely still-answerable "in_progress" attempt is
            // blocked (B1 §4.3): the student is still taking the exam.
            $finalizing = false;

            if ($locked->status === 'grading') {
                $finalizing = true;
            } elseif ($locked->status === 'in_progress') {
                if ($locked->timer_ends_at === null
                    || ! now()->greaterThanOrEqualTo($locked->timer_ends_at)) {
                    throw ValidationException::withMessages([
                        'attempt' => ['Cannot grade an answer before the student has submitted the attempt.'],
                    ]);
                }

                $finalizing = true;
            } elseif ($locked->status !== 'submitted') {
                abort(404);
            }

            // (2) Guards are evaluated under the lock so the grading state is
            // the one visible to this writer, not a pre-lock snapshot.
            $answer->refresh();
            $this->assertGradable($answer);

            // (3) The teacher's award replaces any previous award. `graded`
            // means teacher-final; manual_score is authoritative (B1 API
            // contract §2).
            $answer->forceFill([
                'manual_score' => $data['manual_score'],
                'feedback' => $data['feedback'] ?? null,
                'graded_by_tenant_user_id' => $grader->id,
                'graded_at' => now(),
                'grading_status' => 'graded',
            ])->save();

            // (4) Recompute totals from the locked attempt's answer set.
            $recalculated = $this->recalculate($locked);

            // (4b) Finalize a stuck pre-submission attempt now that the teacher
            // has awarded it: the frozen ("grading") or expired attempt is
            // effectively finished, and marking it "submitted" makes any pending
            // GradeExamAttemptJob a no-op instead of an overwrite of this award.
            if ($finalizing && $recalculated->status !== 'submitted') {
                $submittedAt = now();

                $recalculated->forceFill([
                    'status' => 'submitted',
                    'submitted_at' => $recalculated->submitted_at ?? $submittedAt,
                    'duration_seconds' => $recalculated->duration_seconds ?? $this->computeDuration($recalculated, $submittedAt),
                ])->save();

                $recalculated = $recalculated->refresh();
            }

            return [
                'answer' => $answer->refresh()->load('grader.user'),
                'attempt' => $recalculated,
            ];
        });
    }

    /**
     * Plain list of answers awaiting teacher review for one exam's attempts
     * (Phase E §4). Teacher authorization is enforced at the controller; this
     * service is list-only — no filters, id order, no pagination.
     *
     * @return Collection<int, ExamAttemptAnswer>
     */
    public function pendingReviewAnswers(Exam $exam): Collection
    {
        return ExamAttemptAnswer::query()
            ->whereIn('grading_status', self::PENDING_REVIEW_STATUSES)
            ->whereHas('attempt', fn ($query) => $query->where('exam_id', $exam->id))
            ->with(['attempt.user', 'examQuestion.question'])
            ->orderBy('exam_attempt_answers.id')
            ->get();
    }

    /**
     * Per-exam pending-review counts for the grading hub: only exams the
     * caller may actually grade (same data gate as pendingReviewAnswers' route
     * — ExamPolicy::update). Exams without pending work are omitted.
     *
     * @return array<int, array{examId: string, title: string, pendingCount: int}>
     */
    public function pendingOverview(): array
    {
        $tenantId = currentTenant()->id;

        $rows = ExamAttemptAnswer::query()
            ->selectRaw('exam_attempts.exam_id as exam_id, COUNT(*) as pending_count')
            ->join('exam_attempts', 'exam_attempts.id', '=', 'exam_attempt_answers.exam_attempt_id')
            ->where('exam_attempt_answers.tenant_id', $tenantId)
            ->whereIn('exam_attempt_answers.grading_status', self::PENDING_REVIEW_STATUSES)
            ->where('exam_attempts.tenant_id', $tenantId)
            ->groupBy('exam_attempts.exam_id')
            ->get()
            ->keyBy('exam_id');

        if ($rows->isEmpty()) {
            return [];
        }

        return Exam::query()
            ->whereIn('id', $rows->keys())
            ->get()
            ->filter(fn (Exam $exam): bool => Gate::allows('update', $exam))
            ->map(fn (Exam $exam): array => [
                'examId' => (string) $exam->id,
                'title' => $exam->title,
                'pendingCount' => (int) $rows[$exam->id]->pending_count,
            ])
            ->sortByDesc('pendingCount')
            ->values()
            ->all();
    }

    /**
     * Recompute score / max_score / percentage / passed on the already-locked
     * attempt, implementing B1 §3 exactly:
     *
     *  - per-question points: `max(0, examQuestion->points ?? question->points
     *    ?? 0)` (ExamGradingService.php:54);
     *  - totals: `percentage = totalPoints > 0 ? round(earned / total * 100, 2)
     *    : 0`, `score = earned`, `max_score = total`, `passed = percentage >=
     *    (int) exam->passing_score` (ExamGradingService.php:74-81).
     *
     * The one Phase-E extension B1 §3's "known edge" requires is the manual
     * contribution: a `graded` / `partially_graded` answer contributes its
     * `manual_score` instead of `is_correct ? points : 0`. The contribution for
     * auto-graded answers is read from the stored `is_correct`, which is
     * exactly what grade() persisted (`is_correct ? points : 0`,
     * ExamGradingService.php:63-70) — identical output to re-running the
     * grader, without re-scoring frozen answers against a possibly-edited
     * question.
     *
     * Only called inside the transaction that holds the attempt row lock.
     */
    private function recalculate(ExamAttempt $attempt): ExamAttempt
    {
        $exam = $attempt->exam()->firstOrFail();
        $questions = $this->grading->questionsForAttempt($attempt, $exam);
        $answers = $attempt->answers()->get()->keyBy('exam_question_id');

        $totalPoints = 0;
        $earnedPoints = 0.0;

        foreach ($questions as $examQuestion) {
            $points = max(0, (int) ($examQuestion->points ?? $examQuestion->question?->points ?? 0));
            $totalPoints += $points;

            $saved = $answers->get($examQuestion->id);

            if ($saved === null) {
                continue;
            }

            $earnedPoints += $this->contribution($saved, $points);
        }

        $percentage = $totalPoints > 0 ? round($earnedPoints / $totalPoints * 100, 2) : 0;

        $attempt->forceFill([
            'score' => $earnedPoints,
            'max_score' => $totalPoints,
            'percentage' => $percentage,
            'passed' => $percentage >= (int) $exam->passing_score,
        ])->save();

        return $attempt->refresh();
    }

    /**
     * Same duration-accounting as ExamGradingService::computeDuration() when
     * finalizing a stuck attempt: cap the reported session at the timer if the
     * student overran it.
     */
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

    /**
     * Points one answer contributes to the attempt score.
     *
     *  - `auto_graded` (MCQ-style): the persisted auto result, identical to
     *    B1 §3 lines 63-70.
     *  - `pending_manual_review`: 0 — never auto-scored, nothing awarded yet.
     *  - `partially_graded` / `graded`: `manual_score` — authoritative.
     */
    private function contribution(ExamAttemptAnswer $answer, int $points): float
    {
        return match ($answer->grading_status) {
            'auto_graded' => $answer->is_correct ? $points : 0,
            'pending_manual_review' => 0,
            'partially_graded', 'graded' => (float) ($answer->manual_score ?? 0),
            default => 0,
        };
    }

    private function assertGradable(ExamAttemptAnswer $answer): void
    {
        $type = $answer->examQuestion?->question?->type;

        if (! is_string($type) || ! in_array($type, self::MANUALLY_GRADED_QUESTION_TYPES, true)) {
            throw ValidationException::withMessages([
                'manual_score' => ['Only essay and short_answer answers can be manually graded.'],
            ]);
        }

        if (! in_array($answer->grading_status, self::RE_GRADABLE_STATUSES, true)) {
            throw ValidationException::withMessages([
                'manual_score' => ['This answer is not awaiting or eligible for manual grading.'],
            ]);
        }
    }
}