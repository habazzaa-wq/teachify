<?php

namespace App\Http\Controllers\Api\v1\ExamBank;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExamResource;
use App\Models\Exam;
use App\Repositories\ExamRepository;
use App\Services\ExamBank\ExamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ExamController extends Controller
{
    public function __construct(
        private readonly ExamRepository $repository,
        private readonly ExamService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Exam::class);

        $exams = $this->repository->list($request->all());

        return response()->json([
            'data' => ExamResource::collection($exams),
            'total' => $exams->total(),
            'per_page' => $exams->perPage(),
            'current_page' => $exams->currentPage(),
            'last_page' => $exams->lastPage(),
        ]);
    }

    public function metrics(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Exam::class);

        return response()->json([
            'data' => $this->repository->metricTotals(),
        ]);
    }

    public function recent(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Exam::class);

        return response()->json([
            'data' => ExamResource::collection($this->repository->recent(6)),
        ]);
    }

    public function pinned(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Exam::class);

        return response()->json([
            'data' => ExamResource::collection($this->repository->pinned()),
        ]);
    }

    public function favorites(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Exam::class);

        return response()->json([
            'data' => ExamResource::collection($this->repository->favorites()),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Exam::class);

        $validated = $this->validateExam($request);
        $exam = $this->service->create(currentTenant(), currentTenantUser(), $validated);

        return response()->json([
            'message' => 'Exam created successfully.',
            'data' => new ExamResource($exam),
        ], 201);
    }

    public function show(Exam $exam): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('view', $exam);

        return response()->json([
            'data' => new ExamResource($exam->load(['examQuestions.question.category', 'creator.user'])),
        ]);
    }

    public function update(Request $request, Exam $exam): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $exam);

        $validated = $this->validateExam($request, true);
        $exam = $this->service->update(currentTenant(), $exam, $validated);

        return response()->json([
            'message' => 'Exam updated successfully.',
            'data' => new ExamResource($exam),
        ]);
    }

    public function destroy(Exam $exam): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('delete', $exam);

        $this->repository->delete($exam);

        return response()->json(['message' => 'Exam deleted successfully.']);
    }

    public function updateStatus(Request $request, Exam $exam): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
        ]);

        if ($validated['status'] === 'published') {
            Gate::authorize('publish', $exam);
        } else {
            Gate::authorize('update', $exam);
        }

        $exam = $this->service->changeStatus($exam, $validated['status']);

        return response()->json([
            'message' => 'Exam status updated.',
            'data' => new ExamResource($exam),
        ]);
    }

    public function publish(Exam $exam): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('publish', $exam);

        $exam = $this->service->publish($exam);

        return response()->json([
            'message' => 'Exam published successfully.',
            'data' => new ExamResource($exam),
        ]);
    }

    public function archive(Exam $exam): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $exam);

        $exam = $this->service->archive($exam);

        return response()->json([
            'message' => 'Exam archived successfully.',
            'data' => new ExamResource($exam),
        ]);
    }

    public function restore(int $exam): JsonResponse
    {
        Gate::authorize('update', Exam::class);

        $exam = $this->repository->restore($exam);
        abort_if($exam === null, 404);

        return response()->json([
            'message' => 'Exam restored successfully.',
            'data' => new ExamResource($exam),
        ]);
    }

    public function duplicate(Exam $exam): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('create', Exam::class);

        $copy = $this->service->duplicate($exam, currentTenantUser());

        return response()->json([
            'message' => 'Exam duplicated successfully.',
            'data' => new ExamResource($copy),
        ], 201);
    }

    public function togglePinned(Exam $exam): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $exam);

        $exam = $this->service->togglePinned($exam);

        return response()->json([
            'message' => $exam->pinned ? 'Exam pinned.' : 'Exam unpinned.',
            'data' => new ExamResource($exam),
        ]);
    }

    public function toggleFeatured(Exam $exam): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $exam);

        $exam = $this->service->toggleFeatured($exam);

        return response()->json([
            'message' => $exam->featured ? 'Exam featured.' : 'Exam unfeatured.',
            'data' => new ExamResource($exam),
        ]);
    }

    public function toggleFavorite(Exam $exam): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $exam);

        $exam = $this->service->toggleFavorite($exam);

        return response()->json([
            'message' => 'Exam favorite updated.',
            'data' => new ExamResource($exam),
        ]);
    }

    public function questions(Exam $exam): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('view', $exam);

        return response()->json([
            'data' => \App\Http\Resources\ExamQuestionResource::collection(
                $exam->examQuestions()->with('question.category')->get()
            ),
        ]);
    }

    public function addQuestion(Request $request, Exam $exam): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $exam);

        $validated = $request->validate([
            'question_id' => ['required', 'integer', 'exists:questions,id'],
            'section' => ['nullable', 'string', 'max:120'],
            'points' => ['nullable', 'integer', 'min:0'],
        ]);

        $exam = $this->service->addQuestion(
            $exam,
            $validated['question_id'],
            $validated['section'] ?? null,
            $validated['points'] ?? null,
        );

        return response()->json([
            'message' => 'Question added to exam.',
            'data' => new ExamResource($exam->load('examQuestions.question.category')),
        ]);
    }

    public function updateQuestionLink(Request $request, Exam $exam, Question $question): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $exam);

        $validated = $request->validate([
            'section' => ['nullable', 'string', 'max:120'],
            'points' => ['nullable', 'integer', 'min:0'],
            'order' => ['nullable', 'integer', 'min:1'],
        ]);

        $exam = $this->service->updateQuestionLink($exam, (int) $question->id, $validated);

        return response()->json([
            'message' => 'Exam question updated.',
            'data' => new ExamResource($exam->load('examQuestions.question.category')),
        ]);
    }

    public function removeQuestion(Exam $exam, Question $question): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $exam);

        $exam = $this->service->removeQuestion($exam, (int) $question->id);

        return response()->json([
            'message' => 'Question removed from exam.',
            'data' => new ExamResource($exam->load('examQuestions.question.category')),
        ]);
    }

    public function reorderQuestions(Request $request, Exam $exam): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $exam);

        $validated = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer'],
        ]);

        $exam = $this->service->reorderQuestions($exam, $validated['order']);

        return response()->json([
            'message' => 'Exam questions reordered.',
            'data' => new ExamResource($exam->load('examQuestions.question.category')),
        ]);
    }

    public function setQuestions(Request $request, Exam $exam): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $exam);

        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.question_id' => ['required', 'integer', 'exists:questions,id'],
            'items.*.section' => ['nullable', 'string', 'max:120'],
            'items.*.points' => ['nullable', 'integer', 'min:0'],
        ]);

        $exam = $this->service->setQuestions($exam, $validated['items']);

        return response()->json([
            'message' => 'Exam questions set.',
            'data' => new ExamResource($exam->load('examQuestions.question.category')),
        ]);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $count = 0;
        foreach ($this->repository->findByIds($validated['ids']) as $exam) {
            if (Gate::allows('delete', $exam)) {
                $this->repository->delete($exam);
                $count++;
            }
        }

        return response()->json(['message' => "{$count} exams deleted."]);
    }

    public function bulkRestore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $count = 0;
        foreach ($validated['ids'] as $id) {
            $exam = $this->repository->restore($id);
            if ($exam) {
                $count++;
            }
        }

        return response()->json(['message' => "{$count} exams restored."]);
    }

    public function bulkDuplicate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $copies = [];
        foreach ($this->repository->findByIds($validated['ids']) as $exam) {
            $copies[] = new ExamResource($this->service->duplicate($exam, currentTenantUser()));
        }

        return response()->json([
            'message' => count($copies) . ' exams duplicated.',
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
        foreach ($this->repository->findByIds($validated['ids']) as $exam) {
            if (Gate::allows('update', $exam)) {
                $this->service->archive($exam);
                $count++;
            }
        }

        return response()->json(['message' => "{$count} exams archived."]);
    }

    public function bulkPublish(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $count = 0;
        foreach ($this->repository->findByIds($validated['ids']) as $exam) {
            if (Gate::allows('publish', $exam)) {
                $this->service->publish($exam);
                $count++;
            }
        }

        return response()->json(['message' => "{$count} exams published."]);
    }

    private function validateExam(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$required, 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'alpha_dash:ascii'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:120'],
            'visibility' => ['sometimes', Rule::in(['private', 'organization', 'public'])],
            'language' => ['sometimes', 'string', 'max:10'],
            'duration' => ['nullable', 'integer', 'min:0'],
            'passing_score' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'attempt_limit' => ['nullable', 'integer', 'min:1'],
            'shuffle_questions' => ['sometimes', 'boolean'],
            'shuffle_choices' => ['sometimes', 'boolean'],
            'show_results' => ['sometimes', 'boolean'],
            'show_correct_answers' => ['sometimes', 'boolean'],
            'allow_review' => ['sometimes', 'boolean'],
            'negative_marking' => ['sometimes', 'boolean'],
            'certificate_eligible' => ['sometimes', 'boolean'],
            'random_question_pool' => ['nullable', 'array'],
            'pinned' => ['sometimes', 'boolean'],
            'featured' => ['sometimes', 'boolean'],
        ]);
    }
}
