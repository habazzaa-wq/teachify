<?php

namespace App\Http\Controllers\Api\v1\ExamBank;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExamBank\ExamAttemptPageDeleteRequest;
use App\Http\Requests\ExamBank\ExamAttemptPageReorderRequest;
use App\Models\ExamAttempt;
use App\Models\ExamAttemptAnswerPage;
use App\Models\ExamQuestion;
use App\Services\ExamBank\ExamAnswerPageUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

/**
 * Student-side deletion and reordering of already-confirmed answer pages
 * (Phase D-FIX).
 *
 * Authorization model mirrors ExamAnswerPageUploadController exactly: the only
 * permission gate is the student's own attempt (ExamAttemptPolicy::update,
 * same tenant + same user — what saveAnswer() uses), and every additional
 * constraint (attempt status, question-belongs-to-attempt, essay type, page
 * belongs to the resolved answer) is enforced inside
 * ExamAnswerPageUploadService using the same guard methods the upload intent /
 * confirm endpoints already run.
 */
class ExamAnswerPageManageController extends Controller
{
    public function __construct(
        private readonly ExamAnswerPageUploadService $pages,
    ) {}

    public function destroy(
        ExamAttemptPageDeleteRequest $request,
        ExamAttempt $attempt,
        ExamQuestion $examQuestion,
        ExamAttemptAnswerPage $page,
    ): JsonResponse {
        abort_unless(Gate::allows('update', $attempt), 404);

        $data = $this->pages->deletePage($request->user(), $attempt, $examQuestion, $page);

        return response()->json(['data' => $data]);
    }

    public function reorder(
        ExamAttemptPageReorderRequest $request,
        ExamAttempt $attempt,
        ExamQuestion $examQuestion,
    ): JsonResponse {
        abort_unless(Gate::allows('update', $attempt), 404);

        $data = $this->pages->reorder(
            $request->user(),
            $attempt,
            $examQuestion,
            $request->validated()['page_ids'],
        );

        return response()->json(['data' => $data]);
    }
}
