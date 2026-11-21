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
use Illuminate\Support\Facades\Log;

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

        set_time_limit(600);

        try {
            $result = $this->resumable->finalize($request, $session);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Let Laravel render validation failures as 422 as usual.
            throw $e;
        } catch (\Throwable $e) {
            // Surface the real cause instead of an opaque "Server Error" and keep
            // the session + chunk artifacts intact so the upload can be retried.
            Log::error('media: resumable finalize failed', [
                'session_id' => $session->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Guaranteed file log so the error is capturable even if the Monolog
            // channel is misconfigured or unwritable.
            try {
                $detail = '['.date('c').'] session='.$session->id
                    .' | error='.$e->getMessage()."\n".$e->getTraceAsString()."\n";
                file_put_contents(storage_path('logs/finalize-debug.log'), $detail, FILE_APPEND);
            } catch (\Throwable) {
            }

            return response()->json([
                'message' => 'Finalize failed: '.get_class($e).': '.$e->getMessage(),
            ], 500);
        }

        return response()->json([
            'data' => [
                'asset' => $result['asset'] ? new MediaLibraryAssetResource($result['asset']) : null,
            ],
        ]);
    }

    public function confirmUpload(Request $request, MediaUploadSession $session): JsonResponse
    {
        Gate::authorize('upload', MediaAsset::class);
        $instructor = $request->attributes->get('instructorMembership');
        if ($instructor instanceof \App\Models\TenantUser) {
            abort_unless(
                $session->created_by_tenant_user_id === $instructor->id
                    && $session->asset()
                        ->where(function ($owner) use ($instructor): void {
                            $owner->where('created_by_tenant_user_id', $instructor->id)
                                ->orWhere('uploader_id', $instructor->id);
                        })
                        ->exists(),
                404,
            );
        }

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
     * Server-side upload: accepts a file directly and stores it on the server
     * (tenant-isolated local media storage), returning the ready asset.
     */
    public function uploadFile(Request $request): JsonResponse
    {
        Gate::authorize('upload', MediaAsset::class);

        $data = $request->validate([
            'file' => 'required|file|max:102400',
            'visibility' => 'nullable|in:private,organization,public',
            'folder_id' => 'nullable|integer|exists:media_folders,id',
            'type' => 'nullable|string|max:50',
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
        $extension = strtolower((string) ($file->getClientOriginalExtension() ?: pathinfo($originalName, PATHINFO_EXTENSION)));
        $type = $data['type'] ?? $this->detectType($mime, $extension);

        if ($type === 'video') {
            return response()->json([
                'message' => 'Video uploads must use the video/stream upload flow.',
            ], 422);
        }

        $this->guard->guardFileUpload(
            $tenant,
            $file->getSize(),
            $mime,
        );

        $storageKey = app(\App\Services\Media\StoragePathGenerator::class)->generate($tenant, 'courses', $originalName);

        $media = app(\App\Services\Media\MediaStorage::class);
        $stream = fopen($file->getRealPath(), 'rb');
        try {
            \Illuminate\Support\Facades\Storage::disk($media->diskName())->put($storageKey, $stream);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        $cdnUrl = $media->url($storageKey);

        $asset = \App\Models\MediaAsset::create([
            'tenant_id' => $tenant->id,
            'uploader_id' => $uploader->id,
            'created_by_tenant_user_id' => $uploader->id,
            'folder_id' => $data['folder_id'] ?? null,
            'type' => $type,
            'source' => 'upload',
            'provider' => 'local',
            'provider_service' => 'storage',
            'status' => 'ready',
            'processing_status' => 'ready',
            'visibility' => $visibility,
            'storage_key' => $storageKey,
            'original_filename' => $originalName,
            'original_name' => $originalName,
            'title' => pathinfo($originalName, PATHINFO_FILENAME),
            'mime_type' => $mime,
            'extension' => $extension ?: null,
            'size_bytes' => $file->getSize(),
            'size' => $file->getSize(),
            'cdn_url' => $cdnUrl,
            'metadata' => ['storage_root' => 'courses', 'local' => true],
        ]);

        return response()->json([
            'data' => [
                'asset' => new MediaLibraryAssetResource($asset),
                'cdn_url' => $cdnUrl,
            ],
        ], 201);
    }

    private function detectType(string $mime, string $extension): string
    {
        if (str_starts_with($mime, 'image/')) return 'image';
        if (str_starts_with($mime, 'video/')) return 'video';
        if (str_starts_with($mime, 'audio/')) return 'audio';
        if ($mime === 'application/pdf' || $extension === 'pdf') return 'pdf';
        if (in_array($extension, ['zip', 'rar', '7z', 'tar', 'gz'], true)) return 'archive';
        return 'file';
    }
}
