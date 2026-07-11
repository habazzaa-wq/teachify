<?php

namespace App\Http\Controllers\Api\v1\Media;

use App\Http\Controllers\Controller;
use App\Http\Resources\MediaLibraryAssetResource;
use App\Models\MediaAsset;
use App\Models\MediaUploadSession;
use App\Services\Media\BunnyIntegrationService;
use App\Services\Media\ResumableUploadService;
use App\Services\UploadGuard\UploadGuardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;

class MediaLibraryUploadController extends Controller
{
    public function __construct(
        private readonly BunnyIntegrationService $bunny,
        private readonly \App\Services\Media\StorageUploadService $storageUploads,
        private readonly ResumableUploadService $resumable,
        private readonly UploadGuardService $guard,
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
        $uploadType = $service === 'stream' ? 'video' : 'file';

        $this->guard->guardUpload(
            $tenant,
            $uploadType,
            $data['size_bytes'] ?? null,
            $data['mime_type'] ?? null,
        );

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

    /**
     * Create a resumable upload session that streams chunks to the backend
     * transport (chunk receive / resume / finalize) instead of to Bunny CDN
     * directly. Used by the chunk upload engine.
     */
    public function resumableIntent(Request $request): JsonResponse
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
            'upload_id' => 'nullable|string|max:255',
            'total_chunks' => 'nullable|integer|min:1',
        ]);

        $tenant = currentTenant();
        $uploader = currentTenantUser();

        if (! $uploader) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $service = $data['service'] ?? 'storage';
        $uploadType = $service === 'stream' ? 'video' : 'file';

        $this->guard->guardUpload(
            $tenant,
            $uploadType,
            $data['size_bytes'] ?? null,
            $data['mime_type'] ?? null,
        );

        $result = $this->resumable->createResumableIntent($tenant, $uploader, $data, $service);

        return response()->json([
            'data' => [
                'asset' => new MediaLibraryAssetResource($result['asset']),
                'session_id' => $result['session']->id,
                'upload_url' => $result['intent']['upload_url'] ?? null,
                'upload_method' => $result['intent']['upload_method'] ?? 'PUT',
                'headers' => $result['intent']['headers'] ?? [],
                'expires_at' => $result['session']->expires_at?->toISOString(),
            ],
        ], 201);
    }

    /**
     * Receive a single resumable chunk (validates session, order, checksum).
     */
    public function resumableChunk(Request $request, MediaUploadSession $session): JsonResponse
    {
        Gate::authorize('upload', MediaAsset::class);

        $result = $this->resumable->receiveChunk($request, $session);

        return response()->json(['data' => $result]);
    }

    /**
     * Return the uploaded-chunk bitmap so a client can resume missing chunks.
     */
    public function resumableResume(Request $request, MediaUploadSession $session): JsonResponse
    {
        Gate::authorize('upload', MediaAsset::class);

        $result = $this->resumable->resume($session);

        return response()->json(['data' => $result]);
    }

    /**
     * Finalize: assemble + verify + push to Bunny + purge temporary artifacts.
     */
    public function resumableFinalize(Request $request, MediaUploadSession $session): JsonResponse
    {
        Gate::authorize('upload', MediaAsset::class);

        $result = $this->resumable->finalize($request, $session);

        return response()->json([
            'data' => [
                'asset' => $result['asset'] ? new MediaLibraryAssetResource($result['asset']) : null,
            ],
        ]);
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

    /**
     * Server-side upload: accepts a file directly and pushes it to Bunny Storage
     * from the backend (no browser CORS involved), returning the ready asset.
     * Falls back to local storage when Bunny is not configured for the tenant.
     */
    public function uploadFile(Request $request): JsonResponse
    {
        Gate::authorize('upload', MediaAsset::class);

        $data = $request->validate([
            'file' => 'required|file|max:10240',
            'visibility' => 'nullable|in:private,organization,public',
        ]);

        $tenant = currentTenant();
        $uploader = currentTenantUser();

        if (! $uploader) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $file = $data['file'];
        $mime = $file->getMimeType() ?: 'application/octet-stream';
        $originalName = $file->getClientOriginalName() ?: 'upload';
        $visibility = $data['visibility'] ?? 'private';

        $this->guard->guardFileUpload(
            $tenant,
            $file->getSize(),
            $mime,
        );

        // Detect whether Bunny Storage is actually configured for this tenant.
        $integration = \App\Models\TenantIntegration::query()
            ->where('tenant_id', $tenant->id)
            ->where('provider', 'bunny')
            ->where('service', 'storage')
            ->whereIn('status', ['pending', 'active'])
            ->first();
        $config = $integration?->config ?? [];
        $cdnBaseUrl = rtrim((string) ($config['cdn_base_url'] ?? ''), '/');
        $accessKey = $config['client_upload_key'] ?? $config['password'] ?? null;
        $bunnyReady = $integration && $accessKey && ! empty($cdnBaseUrl);

        $cdnUrl = null;
        $asset = null;

        if ($bunnyReady) {
            // Push to Bunny Storage server-to-server via the storage upload service.
            $intent = $this->storageUploads->createUploadIntent($tenant, $uploader, [
                'type' => 'image',
                'storage_root' => 'courses',
                'original_filename' => $originalName,
                'mime_type' => $mime,
                'size_bytes' => $file->getSize(),
                'visibility' => $visibility,
            ]);

            $asset = $intent['asset'];
            $session = $intent['session'];
            $storageKey = $asset->storage_key;
            $uploadUrl = $intent['intent']['upload_url'] ?? null;

            if (! $uploadUrl || ! str_starts_with((string) $uploadUrl, 'http')) {
                return response()->json(['message' => 'Bunny upload URL is invalid.'], 422);
            }

            $response = Http::withHeaders(array_filter([
                'AccessKey' => $accessKey,
                'Content-Type' => $mime,
            ]))->withBody($file->getContent(), $mime)
                ->put($uploadUrl);

            if (! $response->successful()) {
                return response()->json([
                    'message' => 'Failed to upload to storage.',
                    'storage_status' => $response->status(),
                ], 502);
            }

            $cdnUrl = "{$cdnBaseUrl}/{$storageKey}";

            $result = $this->storageUploads->confirmUpload($tenant, $session, [
                'size_bytes' => $file->getSize(),
            ]);
            $asset = $result['asset'];
        } else {
            // Local fallback: store the file on the public disk and create a
            // minimal asset record without requiring Bunny integration.
            $storageKey = "tenants/{$tenant->id}/courses/" . \Illuminate\Support\Str::random(12) . '.' . ($file->getClientOriginalExtension() ?: 'bin');
            $localPath = "courses/" . basename($storageKey);

            \Illuminate\Support\Facades\Storage::disk('public')->put($localPath, $file->getContent());
            $cdnUrl = \Illuminate\Support\Facades\Storage::disk('public')->url($localPath);

            $asset = \App\Models\MediaAsset::create([
                'tenant_id' => $tenant->id,
                'created_by_tenant_user_id' => $uploader->id,
                'type' => 'image',
                'source' => 'upload',
                'provider' => 'local',
                'provider_service' => 'storage',
                'status' => 'ready',
                'processing_status' => 'ready',
                'visibility' => $visibility,
                'storage_key' => $storageKey,
                'original_filename' => $originalName,
                'title' => pathinfo($originalName, PATHINFO_FILENAME),
                'mime_type' => $mime,
                'extension' => $file->getClientOriginalExtension(),
                'size_bytes' => $file->getSize(),
                'cdn_url' => $cdnUrl,
                'metadata' => ['storage_root' => 'courses', 'local' => true],
            ]);
        }

        if ($asset && $cdnUrl) {
            $asset->forceFill(['cdn_url' => $cdnUrl])->save();
            $asset->refresh();
        }

        return response()->json([
            'data' => [
                'asset' => new MediaLibraryAssetResource($asset),
                'cdn_url' => $cdnUrl,
            ],
        ], 201);
    }
}
