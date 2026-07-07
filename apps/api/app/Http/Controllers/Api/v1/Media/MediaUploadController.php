<?php

namespace App\Http\Controllers\Api\v1\Media;

use App\Http\Controllers\Controller;
use App\Models\MediaAsset;
use App\Models\MediaUploadSession;
use App\Models\TenantUser;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Media\StorageUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MediaUploadController extends Controller
{
    public function store(Request $request, StorageUploadService $uploads, TenantAuthorizationService $authorization): JsonResponse
    {
        $authorization->authorize($request->user(), currentTenant(), 'courses.update');

        $validated = $request->validate([
            'type' => ['required', Rule::in(['image', 'document', 'archive', 'attachment', 'caption', 'thumbnail'])],
            'storage_root' => ['required', Rule::in(['assets', 'courses', 'lessons', 'branding', 'imports', 'exports'])],
            'original_filename' => ['required', 'string', 'max:255'],
            'mime_type' => ['nullable', 'string', 'max:255'],
            'size_bytes' => ['nullable', 'integer', 'min:0'],
            'checksum' => ['nullable', 'string', 'max:255'],
            'visibility' => ['sometimes', Rule::in(['private', 'public'])],
        ]);

        $result = $uploads->createUploadIntent(currentTenant(), app(TenantUser::class), $validated);

        return response()->json([
            'message' => 'Media upload intent created.',
            'asset' => $result['asset'],
            'upload_session' => $result['session'],
            'intent' => $result['intent'],
        ], 201);
    }

    public function confirm(
        Request $request,
        MediaUploadSession $session,
        StorageUploadService $uploads,
        TenantAuthorizationService $authorization,
    ): JsonResponse {
        $this->ensureSessionInTenant($session);
        $authorization->authorize($request->user(), currentTenant(), 'courses.update');

        $validated = $request->validate([
            'external_id' => ['nullable', 'string', 'max:255'],
            'size_bytes' => ['nullable', 'integer', 'min:0'],
            'checksum' => ['nullable', 'string', 'max:255'],
        ]);

        $result = $uploads->confirmUpload(currentTenant(), $session, $validated);

        return response()->json([
            'message' => 'Media upload confirmed.',
            'asset' => $result['asset'],
            'upload_session' => $result['session'],
            'provider' => $result['provider'],
        ]);
    }

    public function status(
        Request $request,
        MediaAsset $asset,
        StorageUploadService $uploads,
        TenantAuthorizationService $authorization,
    ): JsonResponse {
        $this->ensureAssetInTenant($asset);
        $authorization->authorize($request->user(), currentTenant(), 'courses.view');

        return response()->json([
            'asset' => $asset,
            'provider' => $uploads->status(currentTenant(), $asset),
        ]);
    }

    public function destroy(
        Request $request,
        MediaAsset $asset,
        StorageUploadService $uploads,
        TenantAuthorizationService $authorization,
    ): JsonResponse {
        $this->ensureAssetInTenant($asset);
        $authorization->authorize($request->user(), currentTenant(), 'courses.update');

        $asset = $uploads->delete(currentTenant(), $asset);

        return response()->json([
            'message' => 'Media asset deleted.',
            'asset' => $asset,
        ]);
    }

    private function ensureSessionInTenant(MediaUploadSession $session): void
    {
        abort_if($session->tenant_id !== currentTenant()->id, 404);
    }

    private function ensureAssetInTenant(MediaAsset $asset): void
    {
        abort_if($asset->tenant_id !== currentTenant()->id, 404);
    }
}
