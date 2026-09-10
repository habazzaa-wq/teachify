<?php

namespace App\Http\Controllers\Api\v1\ExamBank;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExamBank\StoreManualGradeRequest;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamAttemptAnswer;
use App\Services\ExamBank\ExamManualGradingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Teacher manual grading of essay / short_answer answers (Phase E).
 *
 * Authorization reuses the Phase C teacher leg verbatim — nothing new: both
 * endpoints gate through the exact existing `ExamPolicy::update` call the
 * teacher leg of `ExamAttemptPolicy::viewPages` makes (ExamAttemptPolicy.php:68,
 * ExamPolicy.php:37-49). The student leg of `viewPages` is deliberately NOT
 * used here, so an attempt owner can never grade their own submission. Like
 * every Phase C read, denial is a 404 so the existence of the attempt/exam is
 * not disclosed.
 *
 * Hard rules for this controller:
 *  - no new permission or policy ability (no `exams.grade` split — Phase C
 *    open question #1, see docs/PHASE_C_OPEN_QUESTIONS.md),
 *  - no changes to MediaProxyController, upload intent/confirm, or the Phase C
 *    read endpoints (only the queue-list endpoint is added here),
 *  - backend only — no UI.
 */
class ExamManualGradingController extends Controller
{
    public function __construct(
        private readonly ExamManualGradingService $grading,
    ) {
    }

    /**
     * Save a teacher's manual grade for one answer and recompute the attempt
     * totals in the same transaction.
     *
     * Response: the updated answer (manual_score, feedback, grading_status,
     * graded_by, graded_at) + the updated attempt totals (score, max_score,
     * percentage, passed) — PHASE_E §2.5.
     */
    public function grade(
        StoreManualGradeRequest $request,
        ExamAttempt $attempt,
        ExamAttemptAnswer $answer,
    ): JsonResponse {
        $exam = $attempt->exam()->first();
        abort_unless($exam !== null && Gate::allows('update', $exam), 404);

        $grader = currentTenantUser();

        if (! $grader) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $result = $this->grading->gradeAnswer($grader, $attempt, $answer, $request->validated());

        return response()->json(['data' => $this->gradePayload($result['answer'], $result['attempt'])]);
    }

    /**
     * Answers awaiting teacher review for one exam (Phase E §4).
     *
     * Plain queue list — id order, no filters, no pagination (paginating the
     * Phase C list was deferred as open question #2; a queue pagination policy
     * is likewise out of scope here).
     */
    public function pendingQueue(Request $request, Exam $exam): JsonResponse
    {
        abort_unless(Gate::allows('update', $exam), 404);

        $answers = $this->grading->pendingReviewAnswers($exam);

        return response()->json(['data' => $answers->map(fn (ExamAttemptAnswer $answer): array => $this->queueItem($answer))->values()]);
    }

    /**
     * Grading hub: exams with answers awaiting teacher review, each with its
     * pending count. Authorized per exam (ExamPolicy::update only, matching
     * `pendingQueue`), so the hub never advertises exams the caller cannot
     * actually grade.
     */
    public function overview(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->grading->pendingOverview(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function gradePayload(ExamAttemptAnswer $answer, ExamAttempt $attempt): array
    {
        return [
            'answer' => [
                'id' => (string) $answer->id,
                'examAttemptId' => (string) $answer->exam_attempt_id,
                'examQuestionId' => (string) $answer->exam_question_id,
                'questionId' => (string) $answer->question_id,
                'gradingStatus' => $answer->grading_status,
                'manualScore' => $answer->manual_score !== null ? (float) $answer->manual_score : null,
                'feedback' => $answer->feedback,
                'gradedBy' => $this->gradedBy($answer),
                'gradedAt' => $answer->graded_at?->toIso8601String(),
            ],
            'attempt' => [
                'score' => (float) $attempt->score,
                'maxScore' => (float) $attempt->max_score,
                'percentage' => (float) $attempt->percentage,
                'passed' => (bool) $attempt->passed,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function queueItem(ExamAttemptAnswer $answer): array
    {
        $attempt = $answer->attempt;
        $question = $answer->examQuestion;

        return [
            'id' => (string) $answer->id,
            'examAttemptId' => (string) $answer->exam_attempt_id,
            'examQuestionId' => (string) $answer->exam_question_id,
            'questionId' => (string) $answer->question_id,
            'gradingStatus' => $answer->grading_status,
            'answerMode' => $answer->answer_mode,
            'points' => max(0, (int) ($question?->points ?? $question?->question?->points ?? 0)),
            'pageCount' => $this->pageCount($answer),
            'student' => $attempt?->user !== null ? [
                'id' => (string) $attempt->user->id,
                'name' => $attempt->user->name,
            ] : null,
            'answeredAt' => $answer->answered_at?->toIso8601String(),
            'scoreUrl' => route('exam-bank.answer-pages.index', [
                'attempt' => (string) $answer->exam_attempt_id,
                'examQuestion' => (string) $answer->exam_question_id,
            ]),
        ];
    }

    private function pageCount(ExamAttemptAnswer $answer): ?int
    {
        $count = $answer->pages()->count();

        return $count > 0 ? $count : null;
    }

    /**
     * @return array{id: string, name: ?string}|null
     */
    private function gradedBy(ExamAttemptAnswer $answer): ?array
    {
        if ($answer->graded_by_tenant_user_id === null || $answer->grader === null || $answer->grader->user === null) {
            return null;
        }

        return [
            'id' => (string) $answer->grader->id,
            'name' => $answer->grader->user?->name,
        ];
    }
}