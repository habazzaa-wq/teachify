<?php

namespace App\Http\Controllers\Api\v1\Media;

use App\Http\Controllers\Controller;
use App\Http\Resources\MediaLibraryAssetResource;
use App\Http\Resources\MediaLibraryMetricsResource;
use App\Models\MediaAsset;
use App\Services\Media\MediaLibraryAssetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class MediaLibraryMetricsController extends Controller
{
    public function __construct(
        private readonly MediaLibraryAssetService $assets,
    ) {
    }

    public function index(): JsonResponse
    {
        Gate::authorize('view', MediaAsset::class);

        $tenant = currentTenant();
        $metrics = $this->assets->metrics($tenant);
        $storage = $this->assets->storageUsage($tenant);

        return response()->json([
            'data' => new MediaLibraryMetricsResource(array_merge($metrics, $storage)),
        ]);
    }

    public function storage(): JsonResponse
    {
        Gate::authorize('view', MediaAsset::class);

        $tenant = currentTenant();
        $storage = $this->assets->storageUsage($tenant);

        return response()->json([
            'data' => $storage,
        ]);
    }

    public function recent(Request $request): JsonResponse
    {
        Gate::authorize('view', MediaAsset::class);

        $tenant = currentTenant();
        $limit = min((int) $request->integer('limit', 10), 50);
        $assets = $this->assets->recent($tenant, $limit);

        return response()->json([
            'data' => MediaLibraryAssetResource::collection($assets),
        ]);
    }
}
