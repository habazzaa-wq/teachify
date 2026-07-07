<?php

namespace App\Http\Controllers\Api\v1\Media;

use App\Http\Controllers\Controller;
use App\Http\Resources\MediaLibraryFolderResource;
use App\Models\MediaAsset;
use App\Services\Media\MediaLibraryFolderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class MediaLibraryFolderController extends Controller
{
    public function __construct(
        private readonly MediaLibraryFolderService $folders,
    ) {
    }

    public function tree(): JsonResponse
    {
        Gate::authorize('view', MediaAsset::class);

        $tenant = currentTenant();
        $tree = $this->folders->tree($tenant);

        return response()->json([
            'data' => MediaLibraryFolderResource::collection($tree),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('view', MediaAsset::class);

        $tenant = currentTenant();
        $parentId = $request->integer('parent_id') ?: null;
        $folders = $this->folders->list($tenant, $parentId);

        return response()->json([
            'data' => MediaLibraryFolderResource::collection($folders),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', MediaAsset::class);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|integer|exists:media_folders,id',
        ]);

        $tenant = currentTenant();
        $folder = $this->folders->create($tenant, $data);

        return response()->json([
            'data' => new MediaLibraryFolderResource($folder->load('children')),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        Gate::authorize('view', MediaAsset::class);

        $tenant = currentTenant();
        $folder = $this->folders->findOrFail($tenant, $id);

        return response()->json([
            'data' => new MediaLibraryFolderResource($folder->load('children')),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        Gate::authorize('update', MediaAsset::class);

        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $tenant = currentTenant();
        $folder = $this->folders->findOrFail($tenant, $id);
        $folder = $this->folders->rename($tenant, $folder, $data['name']);

        return response()->json([
            'data' => new MediaLibraryFolderResource($folder->load('children')),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        Gate::authorize('delete', MediaAsset::class);

        $tenant = currentTenant();
        $folder = $this->folders->findOrFail($tenant, $id);
        $this->folders->delete($tenant, $folder);

        return response()->json(['message' => 'Folder deleted successfully.']);
    }

    public function breadcrumbs(int $id): JsonResponse
    {
        Gate::authorize('view', MediaAsset::class);

        $tenant = currentTenant();
        $crumbs = $this->folders->breadcrumbs($tenant, $id);

        return response()->json([
            'data' => $crumbs,
        ]);
    }
}
