<?php

namespace App\Http\Controllers\Api\v1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SubjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('subjects.manage');

        $query = Subject::query()
            ->where('tenant_id', currentTenant()->id)
            ->with('createdBy:id,user_id');

        if ($request->boolean('inactive', false)) {
            $query->where('is_active', false);
        }

        $items = $query->orderBy('sort_order')
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 50));

        return response()->json([
            'data' => $items->items(),
            'total' => $items->total(),
            'per_page' => $items->perPage(),
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('subjects.manage');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'string', 'max:2048'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $subject = Subject::create(array_merge($validated, [
            'tenant_id' => currentTenant()->id,
            'created_by_tenant_user_id' => currentTenantUser()?->id,
        ]));

        return response()->json([
            'message' => 'Subject created successfully.',
            'data' => $subject,
        ], 201);
    }

    public function show(Subject $subject): JsonResponse
    {
        Gate::authorize('subjects.manage');
        abort_if($subject->tenant_id !== currentTenant()->id, 404);

        return response()->json([
            'data' => $subject->load('createdBy:id,user_id'),
        ]);
    }

    public function update(Request $request, Subject $subject): JsonResponse
    {
        Gate::authorize('subjects.manage');
        abort_if($subject->tenant_id !== currentTenant()->id, 404);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'string', 'max:2048'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $subject->update($validated);

        return response()->json([
            'message' => 'Subject updated successfully.',
            'data' => $subject,
        ]);
    }

    public function destroy(Subject $subject): JsonResponse
    {
        Gate::authorize('subjects.manage');
        abort_if($subject->tenant_id !== currentTenant()->id, 404);

        $subject->delete();

        return response()->json(['message' => 'Subject deleted successfully.']);
    }

    public function reorder(Request $request): JsonResponse
    {
        Gate::authorize('subjects.manage');

        $validated = $request->validate([
            'orders' => ['required', 'array'],
            'orders.*.id' => ['required', 'integer', 'exists:subjects,id'],
            'orders.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($validated['orders'] as $item) {
            Subject::query()
                ->where('tenant_id', currentTenant()->id)
                ->where('id', $item['id'])
                ->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['message' => 'Subjects order updated successfully.']);
    }
}
