<?php

namespace App\Http\Controllers\Api\v1\Media;

use App\Http\Controllers\Controller;
use App\Http\Resources\MediaLibraryAssetResource;
use App\Models\MediaAsset;
use App\Models\MediaUploadSession;
use App\Services\Media\BunnyIntegrationService;
use App\Services\Media\LocalUploadService;
use App\Services\Media\MediaLibraryRouting;
use App\Services\Media\ResumableUploadService;
use App\Services\UploadGuard\UploadGuardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class MediaLibraryUploadController extends Controller
{
    public function __construct(
        private readonly BunnyIntegrationService $bunny,
        private readonly LocalUploadService $local,
        private readonly ResumableUploadService $resumable,
        private readonly UploadGuardService $guard,
    ) {
    }

    /**
     * Resolve the physical destination from the request. The discriminator is
     * authoritative; when it is missing we infer it from type/MIME/filename so
     * older clients still cannot send a non-video file to Bunny.
     *
     * @param array<string, mixed> $data
     * @return array{library: string, service: string}
     */
    private function resolveRoute(array $data): array
    {
        return MediaLibraryRouting::resolve(
            $data['library'] ?? null,
            $data['service'] ?? null,
            (string) ($data['type'] ?? ''),
            $data['mime_type'] ?? null,
            (string) ($data['original_filename'] ?? ''),
        );
    }

    public function uploadIntent(Request $request): JsonResponse
    {
        Gate::authorize('upload', MediaAsset::class);

        $data = $request->validate([
            'library' => 'nullable|in:videos,media',
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

        $route = $this->resolveRoute($data);
        $data['library'] = $route['library'];
        $data['service'] = $route['service'];

        if ($route['library'] === MediaLibraryRouting::VIDEOS) {
            // The legacy direct intent hands the client a provider URL without
            // the bytes ever touching this app. Videos must use the resumable
            // transport so their content can be inspected before Bunny receives
            // anything; only non-video assets may use this endpoint.
            throw ValidationException::withMessages([
                'library' => ['Video uploads must use the resumable video upload endpoint.'],
            ]);
        }

        $this->guard->guardUpload(
            $tenant,
            'file',
            $data['size_bytes'] ?? null,
            $data['mime_type'] ?? null,
        );

        $result = $this->local->createUploadIntent($tenant, $uploader, $data);

        return response()->json([
            'data' => [
                'asset' => new MediaLibraryAssetResource($result['asset']),
                'session_id' => $result['session']->id,
                'library' => $route['library'],
                'upload_url' => $result['intent']['upload_url'] ?? null,
                'upload_method' => $result['intent']['method']
                    ?? $result['intent']['upload_method']
                    ?? 'PUT',
                'headers' => $result['intent']['headers'] ?? [],
                'expires_at' => $result['session']->expires_at?->toISOString(),
            ],
        ], 201);
    }

    /**
     * Create a resumable upload session that streams chunks to the backend
     * transport (chunk receive / resume / finalize). Local sessions are written
     * to the tenant's disk; video sessions are handed to Bunny Stream.
     */
    public function resumableIntent(Request $request): JsonResponse
    {
        Gate::authorize('upload', MediaAsset::class);

        $data = $request->validate([
            'library' => 'nullable|in:videos,media',
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

        $route = $this->resolveRoute($data);
        $data['library'] = $route['library'];
        $data['service'] = $route['service'];

        if ($route['library'] === MediaLibraryRouting::VIDEOS) {
            $data['type'] = 'video';
        }

        $this->guard->guardUpload(
            $tenant,
            $route['service'] === 'stream' ? 'video' : 'file',
            $data['size_bytes'] ?? null,
            $data['mime_type'] ?? null,
        );

        $result = $this->resumable->createResumableIntent(
            $tenant,
            $uploader,
            $data,
            $route['service'],
        );

        return response()->json([
            'data' => [
                'asset' => new MediaLibraryAssetResource($result['asset']),
                'session_id' => $result['session']->id,
                'library' => $route['library'],
                'upload_url' => $result['intent']['upload_url'] ?? null,
                'upload_method' => $result['intent']['upload_method'] ?? 'PUT',
                'headers' => $result['intent']['headers'] ?? [],
                'expires_at' => $result['session']->expires_at?->toISOString(),
            ],
        ], 201);
    }

    /**
     * Receive a complete byte body for a local (non-video) upload intent.
     */
    public function uploadLocalBytes(Request $request, MediaUploadSession $session): JsonResponse
    {
        Gate::authorize('upload', MediaAsset::class);

        $size = $request->header('Content-Length');
        $size = is_numeric($size) ? (int) $size : null;

        $result = $this->local->storeBytes(
            currentTenant(),
            $session,
            $request->getContent(),
            $size,
        );

        return response()->json([
            'data' => [
                'asset' => new MediaLibraryAssetResource($result['asset']),
                'session_id' => $result['session']->id,
            ],
        ]);
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
     * Finalize: verify, assemble, then write locally or push to Bunny Stream.
     */
    public function resumableFinalize(Request $request, MediaUploadSession $session): JsonResponse
    {
        Gate::authorize('upload', MediaAsset::class);

        set_time_limit(600);

        try {
            $result = $this->resumable->finalize($request, $session);
        } catch (ValidationException $e) {
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

        $result = $session->provider === 'local'
            ? $this->local->confirmUpload($tenant, $session, $data)
            : $this->bunny->confirmUpload($tenant, $session, $data);

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
        $status = $asset->provider === 'local'
            ? $this->local->status($tenant, $asset)
            : $this->bunny->status($tenant, $asset);

        return response()->json([
            'data' => $status,
        ]);
    }

    public function signedUrl(Request $request, MediaAsset $asset): JsonResponse
    {
        Gate::authorize('download', MediaAsset::class);

        $result = $asset->provider === 'local'
            ? $this->local->signedUrl($asset)
            : $this->bunny->getSignedUrl($asset);

        return response()->json([
            'data' => $result,
        ]);
    }

    /**
     * Server-side upload for the media library only. Non-video files are
     * written directly to the tenant's disk; Bunny Storage is never contacted.
     * Videos must use the Bunny-backed video library endpoints.
     */
    public function uploadFile(Request $request): JsonResponse
    {
        Gate::authorize('upload', MediaAsset::class);

        $data = $request->validate([
            'library' => 'nullable|in:videos,media',
            'file' => 'required|file|max:102400',
            'visibility' => 'nullable|in:private,organization,public',
            'folder_id' => 'nullable|integer|exists:media_folders,id',
            'type' => 'nullable|string|max:50',
            'service' => 'nullable|in:storage,stream',
        ]);

        $tenant = currentTenant();
        $uploader = currentTenantUser();

        if (! $uploader) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $file = $data['file'];
        $mime = $file->getMimeType() ?: 'application/octet-stream';
        $originalName = $file->getClientOriginalName() ?: 'upload';
        $extension = strtolower((string) ($file->getClientOriginalExtension() ?: pathinfo($originalName, PATHINFO_EXTENSION)));
        $type = $data['type'] ?? MediaLibraryRouting::inferNonVideoType($mime, $originalName);

        $route = MediaLibraryRouting::resolve(
            $data['library'] ?? null,
            $data['service'] ?? null,
            $type,
            $mime,
            $originalName,
        );

        if ($route['library'] === MediaLibraryRouting::VIDEOS) {
            throw ValidationException::withMessages([
                'library' => ['Videos must be uploaded through the video library.'],
            ]);
        }

        $this->guard->guardFileUpload(
            $tenant,
            $file->getSize(),
            $mime,
        );

        $result = $this->local->storeDirect($tenant, $uploader, $file, [
            'library' => MediaLibraryRouting::MEDIA,
            'service' => 'storage',
            'visibility' => $data['visibility'] ?? 'private',
            'folder_id' => $data['folder_id'] ?? null,
            'type' => $type,
            'mime_type' => $mime,
        ]);

        $asset = $result['asset'];

        return response()->json([
            'data' => [
                'asset' => new MediaLibraryAssetResource($asset),
                'cdn_url' => $asset->cdn_url,
            ],
        ], 201);
    }
}
