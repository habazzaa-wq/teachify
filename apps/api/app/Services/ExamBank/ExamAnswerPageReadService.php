<?php

namespace App\Services\ExamBank;

use App\Models\ExamAttempt;
use App\Models\ExamAttemptAnswer;
use App\Models\ExamAttemptAnswerPage;
use App\Models\ExamQuestion;
use Illuminate\Database\Eloquent\Collection;

/**
 * Read-only serving of private exam answer pages (Phase C).
 *
 * No grading writes, no recalculation wiring, no file processing: this service
 * only resolves which page rows belong to an (attempt, exam-question) pair and
 * re-verifies the answer/page binding that the upload flow established, so the
 * stream endpoint can never serve a page out of its owning answer.
 *
 * Authorization (who may call) lives at the controller/policy layer
 * (ExamAttemptPolicy::viewPages); this service enforces the DATA-level
 * invariants that everyone must pass regardless of which access leg granted
 * the request — mirroring how ExamAnswerPageUploadService keeps its guard set
 * (tenant + attempt-exam binding + included-question subset) next to the
 * Gate check in the upload controller.
 */
class ExamAnswerPageReadService
{
    /**
     * Ordered pages for one answer, guaranteed to belong to the attempt and
     * exam-question named in the URL.
     *
     * @return array{answer: ?ExamAttemptAnswer, pages: Collection<int, ExamAttemptAnswerPage>}
     */
    public function pages(ExamAttempt $attempt, ExamQuestion $examQuestion): array
    {
        $this->assertQuestionBelongsToAttempt($attempt, $examQuestion);

        $answer = $this->answerFor($attempt, $examQuestion);

        if ($answer === null) {
            abort(404);
        }

        $pages = $answer->pages()->with('mediaAsset')->get();

        return ['answer' => $answer, 'pages' => $pages];
    }

    /**
     * Resolve a single page and prove it belongs to the answer row of the
     * (attempt, exam-question) named in the URL. The page id in the URL may be
     * guessed/brute-forced; every identifier is re-verified here before any
     * byte is returned.
     */
    public function page(ExamAttempt $attempt, ExamQuestion $examQuestion, ExamAttemptAnswerPage $page): ExamAttemptAnswerPage
    {
        $this->assertQuestionBelongsToAttempt($attempt, $examQuestion);

        $answer = $this->answerFor($attempt, $examQuestion);

        if ($answer === null || $page->exam_attempt_answer_id !== $answer->id) {
            abort(404);
        }

        $page->loadMissing('mediaAsset');

        return $page;
    }

    private function answerFor(ExamAttempt $attempt, ExamQuestion $examQuestion): ?ExamAttemptAnswer
    {
        return ExamAttemptAnswer::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('exam_attempt_id', $attempt->id)
            ->where('exam_question_id', $examQuestion->id)
            ->first();
    }

    /**
     * Mirrors ExamSessionService::assertQuestionBelongsToAttempt(): the
     * exam-question must live in the same tenant and belong to the same exam,
     * and it must be part of the attempt's included subset when the attempt
     * restricts it (practice attempts).
     */
    private function assertQuestionBelongsToAttempt(ExamAttempt $attempt, ExamQuestion $examQuestion): void
    {
        if ($examQuestion->tenant_id !== currentTenant()->id || $examQuestion->exam_id !== $attempt->exam_id) {
            abort(404);
        }

        $included = $attempt->included_exam_question_ids;

        if (is_array($included) && $included !== [] && ! in_array((string) $examQuestion->id, array_map('strval', $included), true)) {
            abort(404);
        }
    }
}
