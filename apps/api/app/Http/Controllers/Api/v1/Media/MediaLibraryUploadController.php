<?php

namespace App\Http\Controllers\Api\v1\Media;

use App\Http\Controllers\Controller;
use App\Http\Resources\MediaLibraryAssetResource;
use App\Models\MediaAsset;
use App\Models\MediaUploadSession;
use App\Services\Media\BunnyIntegrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class MediaLibraryUploadController extends Controller
{
    public function __construct(
        private readonly BunnyIntegrationService $bunny,
    ) {
    }

    public function uploadIntent(Request $request): JsonResponse
    {
        Gate::authorize('upload', MediaAsset::class);

        $data = $request->validate([
            'type' => 'required|string|max:50',
            'original_filename' => 'required|string|max:255',
            'mime_type' => 'nullable|string|max:255',
            'size_bytes' => 'nullable|integer|min:0',
            'folder_id' => 'nullable|integer|exists:media_folders,id',
            'visibility' => 'nullable|in:private,organization,public',
            'service' => 'nullable|in:storage,stream',
            'collection' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
        ]);

        $tenant = currentTenant();
        $uploader = currentTenantUser();

        if (! $uploader) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $service = $data['service'] ?? 'storage';

        $result = $this->bunny->createUploadIntent($tenant, $uploader, $data, $service);

        return response()->json([
            'data' => [
                'asset' => new MediaLibraryAssetResource($result['asset']),
                'session_id' => $result['session']->id,
                'upload_url' => $result['intent']['upload_url'] ?? null,
                'upload_method' => $result['intent']['method'] ?? 'PUT',
                'headers' => $result['intent']['headers'] ?? [],
                'expires_at' => $result['session']->expires_at?->toISOString(),
            ],
        ], 201);
    }

    public function confirmUpload(Request $request, MediaUploadSession $session): JsonResponse
    {
        Gate::authorize('upload', MediaAsset::class);

        $data = $request->validate([
            'size_bytes' => 'nullable|integer|min:0',
            'duration_seconds' => 'nullable|numeric|min:0',
            'thumbnail_url' => 'nullable|string|max:2048',
            'preview_url' => 'nullable|string|max:2048',
            'cdn_url' => 'nullable|string|max:2048',
            'width' => 'nullable|integer|min:0',
            'height' => 'nullable|integer|min:0',
            'bunny_stream_url' => 'nullable|string|max:2048',
        ]);

        $tenant = currentTenant();
        $result = $this->bunny->confirmUpload($tenant, $session, $data);

        return response()->json([
            'data' => [
                'asset' => $result['asset'] ? new MediaLibraryAssetResource($result['asset']) : null,
            ],
        ]);
    }

    public function status(Request $request, MediaAsset $asset): JsonResponse
    {
        Gate::authorize('view', MediaAsset::class);

        $tenant = currentTenant();
        $status = $this->bunny->status($tenant, $asset);

        return response()->json([
            'data' => $status,
        ]);
    }

    public function signedUrl(Request $request, MediaAsset $asset): JsonResponse
    {
        Gate::authorize('download', MediaAsset::class);

        $tenant = currentTenant();
        $result = $this->bunny->getSignedUrl($asset);

        return response()->json([
            'data' => $result,
        ]);
    }
}
