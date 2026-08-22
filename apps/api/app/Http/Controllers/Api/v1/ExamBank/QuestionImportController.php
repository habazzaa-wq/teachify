<?php

namespace App\Http\Controllers\Api\v1\ExamBank;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\QuestionImport;
use App\Services\ExamBank\Import\QuestionDocumentValidator;
use App\Services\ExamBank\Import\QuestionImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class QuestionImportController extends Controller
{
    public function __construct(
        private readonly QuestionImportService $service,
        private readonly QuestionDocumentValidator $validator,
    ) {}

    /**
     * Upload a source image and start the extraction pipeline.
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Question::class);

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:'.(int) (config('question-import.upload.max_size', 10485760) / 1024)],
        ]);

        $import = $this->service->create(currentTenant(), currentTenantUser(), $validated['file']);

        return response()->json([
            'message' => 'تم رفع الصورة وبدء المعالجة.',
            'data' => $this->service->statusPayload($import),
        ], 202);
    }

    /**
     * Poll import status/stages; document is included when ready.
     */
    public function show(QuestionImport $import): JsonResponse
    {
        abort_if($import->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('viewAny', Question::class);

        return response()->json(['data' => $this->service->statusPayload($import)]);
    }

    /**
     * Re-run extraction for a failed import.
     */
    public function retry(QuestionImport $import): JsonResponse
    {
        abort_if($import->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('create', Question::class);

        $import = $this->service->retry($import);

        return response()->json([
            'message' => 'تمت إعادة المحاولة.',
            'data' => $this->service->statusPayload($import),
        ]);
    }

    /**
     * Delete an abandoned/failed import and its stored source file.
     */
    public function destroy(QuestionImport $import): JsonResponse
    {
        abort_if($import->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('create', Question::class);

        $this->service->delete($import);

        return response()->json(['message' => 'تم حذف الاستيراد.']);
    }

    /**
     * Validates a (teacher-reviewed) document draft without saving it.
     * Used by the review workspace "check" action.
     */
    public function validateDocument(Request $request): JsonResponse
    {
        Gate::authorize('create', Question::class);

        $validated = $request->validate([
            'document' => ['required', 'string'],
        ]);

        $errors = $this->validator->validateJson($validated['document']);

        return response()->json([
            'data' => [
                'valid' => $errors === [],
                'errors' => $errors,
            ],
        ]);
    }
}
