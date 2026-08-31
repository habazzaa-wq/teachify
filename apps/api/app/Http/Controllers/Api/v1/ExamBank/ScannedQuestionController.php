<?php

namespace App\Http\Controllers\Api\v1\ExamBank;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuestionResource;
use App\Models\Question;
use App\Services\ExamBank\ScannedQuestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ScannedQuestionController extends Controller
{
    public function __construct(
        private readonly ScannedQuestionService $service,
    ) {}

    /**
     * Upload a question image exactly as-is. No OCR, no Vision, no extraction:
     * validate, store, and reference the media asset from the question.
     */
    public function store(Request $request, Question $question): JsonResponse
    {
        abort_if($question->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $question);

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:jpeg,png,webp', 'max:10240'],
            'mode' => ['sometimes', 'string', Rule::in(['auto', 'original_preserve', 'bw_document', 'color_document', 'grayscale_document'])],
        ]);

        // The image is stored and served exactly as uploaded (safe-re-encoded
        // only when a bound resize is required). No OCR/Vision/automatic
        // document processing ever runs on a question image by default.
        $asset = $this->service->processScan(
            currentTenant(),
            currentTenantUser(),
            $question,
            $validated['file'],
            $validated['mode'] ?? 'original_preserve',
        );

        return response()->json([
            'message' => 'Question image uploaded.',
            'data' => new QuestionResource($question->load('mediaAsset')),
        ])->setStatusCode(200);
    }

    /**
     * Remove the attached image from a question. No reconstruction, no OCR.
     */
    public function destroy(Request $request, Question $question): JsonResponse
    {
        abort_if($question->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $question);

        $this->service->unlinkScan($question);

        return response()->json([
            'message' => 'Question image removed.',
            'data' => new QuestionResource($question->load('mediaAsset')),
        ]);
    }
}
