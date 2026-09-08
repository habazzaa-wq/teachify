<?php

namespace App\Http\Controllers\Api\v1\ExamBank;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExamBank\ExamAttemptPageConfirmRequest;
use App\Http\Requests\ExamBank\ExamAttemptPageUploadIntentRequest;
use App\Models\ExamAttempt;
use App\Models\ExamQuestion;
use App\Models\MediaUploadSession;
use App\Services\ExamBank\ExamAnswerPageUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

/**
 * Student-private page uploads for image-mode essay answers (Phase B2).
 *
 * Authorization model: the only permission gate is the student's own attempt
 * (ExamAttemptPolicy::update, same tenant + same user — exactly what
 * saveAnswer() uses), NOT the media library `upload` permission. Every
 * additional constraint (attempt status, question-belongs-to-attempt, essay
 * type, session->attempt binding) is enforced inside
 * ExamAnswerPageUploadService, mirroring the ExamSessionService guard set.
 */
class ExamAnswerPageUploadController extends Controller
{
    public function __construct(
        private readonly ExamAnswerPageUploadService $pages,
    ) {
    }

    public function uploadIntent(
        ExamAttemptPageUploadIntentRequest $request,
        ExamAttempt $attempt,
        ExamQuestion $examQuestion,
    ): JsonResponse {
        abort_unless(Gate::allows('update', $attempt), 404);

        $uploader = currentTenantUser();

        if (! $uploader) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $result = $this->pages->intent($uploader, $request->user(), $attempt, $examQuestion, $request->validated());

        return response()->json([
            'data' => [
                'session_id' => $result['session']->id,
                'upload_url' => $result['intent']['upload_url'] ?? null,
                'upload_method' => $result['intent']['method'] ?? 'PUT',
                'storage_key' => $result['intent']['storage_key'] ?? null,
                'headers' => $result['intent']['headers'] ?? [],
                'expires_at' => $result['session']->expires_at?->toISOString(),
            ],
        ], 201);
    }

    public function confirm(
        ExamAttemptPageConfirmRequest $request,
        ExamAttempt $attempt,
        ExamQuestion $examQuestion,
        MediaUploadSession $session,
    ): JsonResponse {
        abort_unless(Gate::allows('update', $attempt), 404);

        $result = $this->pages->confirm($request->user(), $attempt, $examQuestion, $session, $request->validated());

        return response()->json([
            'message' => 'Page confirmed.',
            'data' => [
                'page_id' => $result['page']->id,
                'page_order' => $result['page']->page_order,
                'answer_id' => $result['answer']->id,
                'grading_status' => $result['answer']->grading_status,
                'media_asset_id' => $result['page']->media_asset_id,
            ],
        ], 201);
    }
}