<?php

namespace App\Http\Controllers\Api\v1\Media;

use App\Http\Controllers\Controller;
use App\Http\Resources\MediaLibraryAssetResource;
use App\Models\MediaAsset;
use App\Models\Tenant;
use App\Policies\MediaLibraryPolicy;
use App\Services\Media\MediaLibraryAssetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class MediaLibraryController extends Controller
{
    public function __construct(
        private readonly MediaLibraryAssetService $assets,
        private readonly MediaLibraryPolicy $policy,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('view', MediaAsset::class);

        $tenant = currentTenant();
        $params = $request->validate([
            'folder_id' => 'nullable|integer|exists:media_folders,id',
            'root' => 'nullable|boolean',
            'search' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:50',
            'types' => 'nullable|array',
            'types.*' => 'string|max:50',
            'status' => 'nullable|string|max:50',
            'visibility' => 'nullable|string|max:50',
            'processing_status' => 'nullable|string|max:50',
            'favorites' => 'nullable|boolean',
            'archived' => 'nullable|boolean',
            'extension' => 'nullable|string|max:20',
            'uploader_id' => 'nullable|integer',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:100',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'sort' => 'nullable|string|max:50',
            'sort_dir' => 'nullable|in:asc,desc',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $result = $this->assets->list($tenant, $params);

        return response()->json([
            'data' => MediaLibraryAssetResource::collection($result->items()),
            'meta' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
                'from' => $result->firstItem(),
                'to' => $result->lastItem(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        Gate::authorize('view', MediaAsset::class);

        $tenant = currentTenant();
        $asset = $this->assets->findOrFail($tenant, $id);

        return response()->json([
            'data' => new MediaLibraryAssetResource($asset),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        Gate::authorize('update', MediaAsset::class);

        $tenant = currentTenant();
        $asset = $this->assets->findOrFail($tenant, $id);

        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:5000',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:100',
            'visibility' => 'nullable|in:private,organization,public',
            'folder_id' => 'nullable|integer|exists:media_folders,id',
            'thumbnail_url' => 'nullable|string|max:2048',
            'preview_url' => 'nullable|string|max:2048',
        ]);

        $asset = $this->assets->update($tenant, $asset, $data);

        return response()->json([
            'data' => new MediaLibraryAssetResource($asset),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        Gate::authorize('delete', MediaAsset::class);

        $tenant = currentTenant();
        $asset = $this->assets->findOrFail($tenant, $id);
        $this->assets->softDelete($tenant, $asset);

        return response()->json(['message' => 'Asset deleted successfully.']);
    }

    public function restore(Request $request, int $id): JsonResponse
    {
        Gate::authorize('delete', MediaAsset::class);

        $tenant = currentTenant();
        $asset = MediaAsset::query()
            ->where('tenant_id', $tenant->id)
            ->onlyTrashed()
            ->findOrFail($id);

        $this->assets->restore($tenant, $asset);

        return response()->json([
            'data' => new MediaLibraryAssetResource($asset->load(['folder', 'uploader'])),
        ]);
    }

    public function duplicate(Request $request, int $id): JsonResponse
    {
        Gate::authorize('create', MediaAsset::class);

        $tenant = currentTenant();
        $asset = $this->assets->findOrFail($tenant, $id);
        $copy = $this->assets->duplicate($tenant, $asset);

        return response()->json([
            'data' => new MediaLibraryAssetResource($copy),
        ], 201);
    }

    public function rename(Request $request, int $id): JsonResponse
    {
        Gate::authorize('update', MediaAsset::class);

        $data = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $tenant = currentTenant();
        $asset = $this->assets->findOrFail($tenant, $id);
        $this->assets->rename($tenant, $asset, $data['title']);

        return response()->json([
            'data' => new MediaLibraryAssetResource($asset),
        ]);
    }

    public function move(Request $request, int $id): JsonResponse
    {
        Gate::authorize('update', MediaAsset::class);

        $data = $request->validate([
            'folder_id' => 'nullable|integer|exists:media_folders,id',
        ]);

        $tenant = currentTenant();
        $asset = $this->assets->findOrFail($tenant, $id);
        $this->assets->move($tenant, $asset, $data['folder_id']);

        return response()->json([
            'data' => new MediaLibraryAssetResource($asset),
        ]);
    }

    public function favorite(Request $request, int $id): JsonResponse
    {
        Gate::authorize('update', MediaAsset::class);

        $tenant = currentTenant();
        $asset = $this->assets->findOrFail($tenant, $id);
        $this->assets->toggleFavorite($tenant, $asset);

        return response()->json([
            'data' => new MediaLibraryAssetResource($asset),
        ]);
    }

    public function archiveAsset(Request $request, int $id): JsonResponse
    {
        Gate::authorize('archive', MediaAsset::class);

        $tenant = currentTenant();
        $asset = $this->assets->findOrFail($tenant, $id);
        $this->assets->archive($tenant, $asset);

        return response()->json([
            'data' => new MediaLibraryAssetResource($asset),
        ]);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        Gate::authorize('delete', MediaAsset::class);

        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        $tenant = currentTenant();
        $count = $this->assets->bulkDelete($tenant, $data['ids']);

        return response()->json(['message' => "{$count} assets deleted successfully."]);
    }

    public function bulkRestore(Request $request): JsonResponse
    {
        Gate::authorize('delete', MediaAsset::class);

        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        $tenant = currentTenant();
        $count = $this->assets->bulkRestore($tenant, $data['ids']);

        return response()->json(['message' => "{$count} assets restored successfully."]);
    }

    public function bulkMove(Request $request): JsonResponse
    {
        Gate::authorize('update', MediaAsset::class);

        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
            'folder_id' => 'nullable|integer|exists:media_folders,id',
        ]);

        $tenant = currentTenant();
        $count = $this->assets->bulkMove($tenant, $data['ids'], $data['folder_id']);

        return response()->json(['message' => "{$count} assets moved successfully."]);
    }

    public function bulkTag(Request $request): JsonResponse
    {
        Gate::authorize('update', MediaAsset::class);

        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
            'tags' => 'required|array',
            'tags.*' => 'string|max:100',
        ]);

        $tenant = currentTenant();
        $count = $this->assets->bulkTag($tenant, $data['ids'], $data['tags']);

        return response()->json(['message' => "{$count} assets tagged successfully."]);
    }
}
