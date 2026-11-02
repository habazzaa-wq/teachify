<?php

namespace App\Http\Controllers\Api\v1\Media;

use App\Http\Controllers\Controller;
use App\Http\Resources\MediaLibraryAssetResource;
use App\Http\Resources\MediaLibraryMetricsResource;
use App\Models\MediaAsset;
use App\Models\TenantUser;
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

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('view', MediaAsset::class);

        $tenant = currentTenant();
        $ownerId = $this->instructorOwnerId($request);
        $metrics = $this->assets->metrics($tenant, $ownerId);
        $storage = $this->assets->storageUsage($tenant, $ownerId);

        return response()->json([
            'data' => new MediaLibraryMetricsResource(array_merge($metrics, $storage)),
        ]);
    }

    public function storage(Request $request): JsonResponse
    {
        Gate::authorize('view', MediaAsset::class);

        $tenant = currentTenant();
        $storage = $this->assets->storageUsage($tenant, $this->instructorOwnerId($request));

        return response()->json([
            'data' => $storage,
        ]);
    }

    public function recent(Request $request): JsonResponse
    {
        Gate::authorize('view', MediaAsset::class);

        $tenant = currentTenant();
        $limit = min((int) $request->integer('limit', 10), 50);
        $assets = $this->assets->recent($tenant, $limit, $this->instructorOwnerId($request));

        return response()->json([
            'data' => MediaLibraryAssetResource::collection($assets),
        ]);
    }

    private function instructorOwnerId(Request $request): ?int
    {
        $instructor = $request->attributes->get('instructorMembership');

        return $instructor instanceof TenantUser ? (int) $instructor->id : null;
    }
}
