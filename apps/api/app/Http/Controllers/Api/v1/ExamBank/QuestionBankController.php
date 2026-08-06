<?php

namespace App\Http\Controllers\Api\v1\ExamBank;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuestionBankResource;
use App\Models\QuestionBank;
use App\Repositories\QuestionBankRepository;
use App\Services\ExamBank\QuestionBankService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class QuestionBankController extends Controller
{
    public function __construct(
        private readonly QuestionBankRepository $repository,
        private readonly QuestionBankService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', QuestionBank::class);

        $banks = $this->repository->list($request->all());

        return response()->json([
            'data' => QuestionBankResource::collection($banks),
            'total' => $banks->total(),
            'per_page' => $banks->perPage(),
            'current_page' => $banks->currentPage(),
            'last_page' => $banks->lastPage(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', QuestionBank::class);

        $validated = $this->validateBank($request);
        $bank = $this->service->create(currentTenant(), currentTenantUser(), $validated);

        return response()->json([
            'message' => 'Question bank created successfully.',
            'data' => new QuestionBankResource($bank),
        ], 201);
    }

    public function show(QuestionBank $bank): JsonResponse
    {
        abort_if($bank->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('view', $bank);

        return response()->json([
            'data' => new QuestionBankResource($bank->loadCount('questions')),
        ]);
    }

    public function update(Request $request, QuestionBank $bank): JsonResponse
    {
        abort_if($bank->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $bank);

        $validated = $this->validateBank($request, true);
        $bank = $this->service->update(currentTenant(), $bank, $validated);

        return response()->json([
            'message' => 'Question bank updated successfully.',
            'data' => new QuestionBankResource($bank),
        ]);
    }

    public function destroy(QuestionBank $bank): JsonResponse
    {
        abort_if($bank->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('delete', $bank);

        $this->repository->delete($bank);

        return response()->json(['message' => 'Question bank deleted successfully.']);
    }

    public function updateStatus(Request $request, QuestionBank $bank): JsonResponse
    {
        abort_if($bank->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $bank);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'inactive', 'archived'])],
        ]);

        $bank = $this->service->changeStatus($bank, $validated['status']);

        return response()->json([
            'message' => 'Question bank status updated.',
            'data' => new QuestionBankResource($bank),
        ]);
    }

    public function restore(int $bank): JsonResponse
    {
        Gate::authorize('restore', QuestionBank::class);

        $bank = $this->repository->restore($bank);
        abort_if($bank === null, 404);

        return response()->json([
            'message' => 'Question bank restored successfully.',
            'data' => new QuestionBankResource($bank),
        ]);
    }

    private function validateBank(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'alpha_dash:ascii'],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer', 'exists:question_categories,id'],
            'visibility' => ['sometimes', Rule::in(['private', 'organization', 'public'])],
        ]);
    }
}
