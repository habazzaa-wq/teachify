<?php

namespace App\Http\Controllers\Api\v1\ExamBank;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuestionResource;
use App\Models\Question;
use App\Repositories\QuestionRepository;
use App\Services\ExamBank\QuestionService;
use App\Services\ExamBank\ScannedQuestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class QuestionController extends Controller
{
    public function __construct(
        private readonly QuestionRepository $repository,
        private readonly QuestionService $service,
        private readonly ScannedQuestionService $scanService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Question::class);

        $questions = $this->repository->list($request->all());

        return response()->json([
            'data' => QuestionResource::collection($questions),
            'total' => $questions->total(),
            'per_page' => $questions->perPage(),
            'current_page' => $questions->currentPage(),
            'last_page' => $questions->lastPage(),
        ]);
    }

    public function metrics(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Question::class);

        return response()->json([
            'data' => [
                'total' => $this->repository->countByStatus('draft')
                    + $this->repository->countByStatus('published')
                    + $this->repository->countByStatus('archived'),
                'published' => $this->repository->countByStatus('published'),
                'draft' => $this->repository->countByStatus('draft'),
                'archived' => $this->repository->countByStatus('archived'),
                'byType' => $this->repository->countByType(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Question::class);

        $validated = $this->validateQuestion($request);
        $question = $this->service->create(currentTenant(), currentTenantUser(), $validated);

        return response()->json([
            'message' => 'Question created successfully.',
            'data' => new QuestionResource($question),
        ], 201);
    }

    public function show(Question $question): JsonResponse
    {
        abort_if($question->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('view', $question);

        return response()->json([
            'data' => new QuestionResource($question->load(['category', 'creator.user', 'scan'])),
        ]);
    }

    public function update(Request $request, Question $question): JsonResponse
    {
        abort_if($question->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $question);

        $validated = $this->validateQuestion($request, true);
        $question = $this->service->update(currentTenant(), $question, $validated);

        return response()->json([
            'message' => 'Question updated successfully.',
            'data' => new QuestionResource($question),
        ]);
    }

    public function destroy(Question $question): JsonResponse
    {
        abort_if($question->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('delete', $question);

        $this->repository->delete($question);

        return response()->json(['message' => 'Question deleted successfully.']);
    }

    public function updateStatus(Request $request, Question $question): JsonResponse
    {
        abort_if($question->tenant_id !== currentTenant()->id, 404);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
        ]);

        if ($validated['status'] === 'published') {
            Gate::authorize('publish', $question);
        } else {
            Gate::authorize('update', $question);
        }

        $question = $this->service->changeStatus($question, $validated['status']);

        return response()->json([
            'message' => 'Question status updated.',
            'data' => new QuestionResource($question),
        ]);
    }

    public function publish(Question $question): JsonResponse
    {
        abort_if($question->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('publish', $question);

        $question = $this->service->publish($question);

        return response()->json([
            'message' => 'Question published successfully.',
            'data' => new QuestionResource($question),
        ]);
    }

    public function archive(Question $question): JsonResponse
    {
        abort_if($question->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $question);

        $question = $this->service->archive($question);

        return response()->json([
            'message' => 'Question archived successfully.',
            'data' => new QuestionResource($question),
        ]);
    }

    public function restore(int $question): JsonResponse
    {
        Gate::authorize('restore', Question::class);

        $question = $this->repository->restore($question);
        abort_if($question === null, 404);

        return response()->json([
            'message' => 'Question restored successfully.',
            'data' => new QuestionResource($question),
        ]);
    }

    public function duplicate(Question $question): JsonResponse
    {
        abort_if($question->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('create', Question::class);

        $copy = $this->service->duplicate($question, currentTenantUser());

        return response()->json([
            'message' => 'Question duplicated successfully.',
            'data' => new QuestionResource($copy),
        ], 201);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        Gate::authorize('delete', Question::class);

        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $count = 0;
        foreach ($this->repository->findByIds($validated['ids']) as $question) {
            if (Gate::allows('delete', $question)) {
                $this->repository->delete($question);
                $count++;
            }
        }

        return response()->json(['message' => "{$count} questions deleted."]);
    }

    public function bulkRestore(Request $request): JsonResponse
    {
        Gate::authorize('restore', Question::class);

        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $count = 0;
        foreach ($validated['ids'] as $id) {
            $question = $this->repository->restore($id);
            if ($question) {
                $count++;
            }
        }

        return response()->json(['message' => "{$count} questions restored."]);
    }

    public function bulkDuplicate(Request $request): JsonResponse
    {
        Gate::authorize('create', Question::class);

        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $copies = [];
        foreach ($this->repository->findByIds($validated['ids']) as $question) {
            $copies[] = new QuestionResource($this->service->duplicate($question, currentTenantUser()));
        }

        return response()->json([
            'message' => count($copies) . ' questions duplicated.',
            'data' => $copies,
        ], 201);
    }

    public function bulkArchive(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $count = 0;
        foreach ($this->repository->findByIds($validated['ids']) as $question) {
            if (Gate::allows('update', $question)) {
                $this->service->archive($question);
                $count++;
            }
        }

        return response()->json(['message' => "{$count} questions archived."]);
    }

    public function bulkMoveCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
            'category_id' => ['required', 'integer', 'exists:question_categories,id'],
            'bank_id' => ['nullable', 'integer', 'exists:question_banks,id'],
        ]);

        $count = 0;
        foreach ($this->repository->findByIds($validated['ids']) as $question) {
            if (Gate::allows('update', $question)) {
                $this->service->update(currentTenant(), $question, [
                    'category_id' => $validated['category_id'],
                    'bank_id' => $validated['bank_id'] ?? null,
                ]);
                $count++;
            }
        }

        return response()->json(['message' => "{$count} questions moved."]);
    }

    public function uploadScan(Request $request, Question $question): JsonResponse
    {
        abort_if($question->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $question);

        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:jpeg,png,webp'],
        ]);

        $errors = $this->scanService->validateUpload($request->file('file'));
        if (! empty($errors)) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $errors], 422);
        }

        $asset = $this->scanService->processScan(
            currentTenant(),
            currentTenantUser(),
            $question,
            $request->file('file'),
        );

        return response()->json([
            'message' => 'تم رفع ومعالجة الصورة بنجاح.',
            'data' => new QuestionResource($question->refresh()->load(['scan'])),
        ]);
    }

    public function removeScan(Question $question): JsonResponse
    {
        abort_if($question->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $question);

        $this->scanService->unlinkScan($question);

        return response()->json([
            'message' => 'تم إزالة الصورة المرفقة بنجاح.',
            'data' => new QuestionResource($question->refresh()->load(['scan'])),
        ]);
    }

    private function validateQuestion(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$required, 'string', 'max:500'],
            'slug' => ['sometimes', 'string', 'max:500', 'alpha_dash:ascii'],
            'description' => ['nullable', 'string'],
            'type' => [$required, Rule::in([
                'single_choice', 'multiple_choice', 'true_false', 'short_answer',
                'essay', 'fill_blank', 'matching', 'ordering', 'numeric',
                'file_upload', 'coding',
            ])],
            'difficulty' => ['sometimes', Rule::in(['easy', 'medium', 'hard'])],
            'category_id' => ['nullable', 'integer', 'exists:question_categories,id'],
            'bank_id' => ['nullable', 'integer', 'exists:question_banks,id'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:64'],
            'points' => ['sometimes', 'integer', 'min:0'],
            'estimated_time' => ['nullable', 'integer', 'min:0'],
            'language' => ['sometimes', 'string', 'max:10'],
            'visibility' => ['sometimes', Rule::in(['private', 'organization', 'public'])],
            'shuffle_options' => ['sometimes', 'boolean'],
            'explanation' => ['nullable', 'string'],
            'hint' => ['nullable', 'string'],
            'content' => ['nullable', 'array'],
            'metadata' => ['nullable', 'array'],
            'question_format' => ['sometimes', 'string', Rule::in(['text', 'image'])],
            'media_asset_id' => ['nullable', 'integer', 'exists:media_assets,id'],
        ]);
    }
}
