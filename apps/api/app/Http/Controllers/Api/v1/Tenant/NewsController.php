<?php

namespace App\Http\Controllers\Api\v1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\News;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class NewsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('news.manage');

        $query = News::query()
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
        Gate::authorize('news.manage');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'url' => ['nullable', 'string', 'max:2048', 'url'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
        ]);

        $news = News::create(array_merge($validated, [
            'tenant_id' => currentTenant()->id,
            'created_by_tenant_user_id' => currentTenantUser()?->id,
        ]));

        return response()->json([
            'message' => 'News item created successfully.',
            'data' => $news,
        ], 201);
    }

    public function show(News $news): JsonResponse
    {
        Gate::authorize('news.manage');
        abort_if($news->tenant_id !== currentTenant()->id, 404);

        return response()->json([
            'data' => $news->load('createdBy:id,user_id'),
        ]);
    }

    public function update(Request $request, News $news): JsonResponse
    {
        Gate::authorize('news.manage');
        abort_if($news->tenant_id !== currentTenant()->id, 404);

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'url' => ['nullable', 'string', 'max:2048', 'url'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
        ]);

        $news->update($validated);

        return response()->json([
            'message' => 'News item updated successfully.',
            'data' => $news,
        ]);
    }

    public function destroy(News $news): JsonResponse
    {
        Gate::authorize('news.manage');
        abort_if($news->tenant_id !== currentTenant()->id, 404);

        $news->delete();

        return response()->json(['message' => 'News item deleted successfully.']);
    }

    public function reorder(Request $request): JsonResponse
    {
        Gate::authorize('news.manage');

        $validated = $request->validate([
            'orders' => ['required', 'array'],
            'orders.*.id' => ['required', 'integer', 'exists:news,id'],
            'orders.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($validated['orders'] as $item) {
            News::query()
                ->where('tenant_id', currentTenant()->id)
                ->where('id', $item['id'])
                ->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['message' => 'News order updated successfully.']);
    }
}
