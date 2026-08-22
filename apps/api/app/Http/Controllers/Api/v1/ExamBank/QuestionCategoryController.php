<?php

namespace App\Http\Controllers\Api\v1\ExamBank;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuestionCategoryResource;
use App\Models\QuestionCategory;
use App\Repositories\QuestionCategoryRepository;
use App\Services\ExamBank\QuestionBankService;
use App\Services\ExamBank\QuestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class QuestionCategoryController extends Controller
{
    public function __construct(
        private readonly QuestionCategoryRepository $repository,
        private readonly QuestionService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', QuestionCategory::class);

        $categories = $this->repository->list($request->all());

        return response()->json([
            'data' => QuestionCategoryResource::collection($categories),
            'total' => $categories->total(),
            'per_page' => $categories->perPage(),
            'current_page' => $categories->currentPage(),
            'last_page' => $categories->lastPage(),
        ]);
    }

    public function tree(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', QuestionCategory::class);

        return response()->json([
            'data' => QuestionCategoryResource::collection($this->repository->tree()),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', QuestionCategory::class);

        $validated = $this->validateCategory($request);
        $category = $this->service->createCategory(currentTenant(), currentTenantUser(), $validated);

        return response()->json([
            'message' => 'Question category created successfully.',
            'data' => new QuestionCategoryResource($category),
        ], 201);
    }

    public function show(QuestionCategory $category): JsonResponse
    {
        abort_if($category->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('view', $category);

        return response()->json([
            'data' => new QuestionCategoryResource($category->loadCount('questions')),
        ]);
    }

    public function update(Request $request, QuestionCategory $category): JsonResponse
    {
        abort_if($category->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $category);

        $validated = $this->validateCategory($request, true);
        $category = $this->service->updateCategory(currentTenant(), $category, $validated);

        return response()->json([
            'message' => 'Question category updated successfully.',
            'data' => new QuestionCategoryResource($category),
        ]);
    }

    public function destroy(QuestionCategory $category): JsonResponse
    {
        abort_if($category->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('delete', $category);

        $this->repository->delete($category);

        return response()->json(['message' => 'Question category deleted successfully.']);
    }

    public function restore(int $category): JsonResponse
    {
        Gate::authorize('update', QuestionCategory::class);

        $category = $this->repository->restore($category);
        abort_if($category === null, 404);

        return response()->json([
            'message' => 'Question category restored successfully.',
            'data' => new QuestionCategoryResource($category),
        ]);
    }

    private function validateCategory(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'alpha_dash:ascii'],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:32'],
            'icon' => ['nullable', 'string', 'max:64'],
            'parent_id' => ['nullable', 'integer', 'exists:question_categories,id'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'archived'])],
        ]);
    }
}
