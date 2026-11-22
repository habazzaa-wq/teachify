<?php

namespace App\Services\Media;

use App\Models\MediaAsset;
use App\Models\MediaUploadSession;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Reserves assets/sessions for the tenant's own media library and writes the
 * bytes through MediaStorage. It is the local counterpart of
 * BunnyIntegrationService and is used for every non-video upload.
 */
class LocalUploadService
{
    private const STORAGE_ROOT = 'assets';

    public function __construct(
        private readonly MediaManager $manager,
        private readonly MediaStorage $storage,
        private readonly StoragePathGenerator $paths,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     * @return array{asset: MediaAsset, session: MediaUploadSession, intent: array<string, mixed>}
     */
    public function createUploadIntent(Tenant $tenant, TenantUser $creator, array $data): array
    {
        $filename = (string) ($data['original_filename'] ?? 'untitled');
        $type = (string) ($data['type'] ?? MediaLibraryRouting::inferNonVideoType(
            $data['mime_type'] ?? null,
            $filename,
        ));

        if (MediaLibraryRouting::isVideoCandidate($type, $data['mime_type'] ?? null, $filename)) {
            throw ValidationException::withMessages([
                'library' => ['Videos must be uploaded through the video library.'],
            ]);
        }

        $storageKey = $this->paths->generate($tenant, self::STORAGE_ROOT, $filename);

        return DB::transaction(function () use ($tenant, $creator, $data, $filename, $type, $storageKey): array {
            $asset = MediaAsset::create([
                'tenant_id' => $tenant->id,
                'uploader_id' => $creator->id,
                'created_by_tenant_user_id' => $creator->id,
                'folder_id' => $data['folder_id'] ?? null,
                'type' => $type,
                'source' => $data['source'] ?? 'upload',
                'provider' => 'local',
                'provider_service' => 'storage',
                'status' => 'pending',
                'processing_status' => 'uploading',
                'visibility' => $data['visibility'] ?? 'private',
                'storage_key' => $storageKey,
                'original_filename' => $filename,
                'original_name' => $filename,
                'title' => $data['title'] ?? pathinfo($filename, PATHINFO_FILENAME),
                'mime_type' => $data['mime_type'] ?? null,
                'extension' => pathinfo($filename, PATHINFO_EXTENSION),
                'size_bytes' => $data['size_bytes'] ?? 0,
                'metadata' => [
                    'library' => MediaLibraryRouting::MEDIA,
                    'storage_root' => self::STORAGE_ROOT,
                ],
            ]);

            $session = MediaUploadSession::create([
                'tenant_id' => $tenant->id,
                'media_asset_id' => $asset->id,
                'created_by_tenant_user_id' => $creator->id,
                'provider' => 'local',
                'provider_service' => 'storage',
                'status' => 'draft',
                'expires_at' => now()->addMinutes(120),
                'metadata' => [
                    'library' => MediaLibraryRouting::MEDIA,
                    'storage_key' => $storageKey,
                    'asset_type' => $type,
                ],
            ]);

            $intent = $this->provider()->createUploadIntent($session, [
                'storage_key' => $storageKey,
                'original_filename' => $filename,
            ]);

            return [
                'asset' => $asset->fresh()->load(['folder', 'uploader']),
                'session' => $session->fresh(),
                'intent' => $intent,
            ];
        });
    }

    /**
     * Store a complete file received by the server-side upload endpoint.
     *
     * @param array<string, mixed> $data
     * @return array{asset: MediaAsset, session: MediaUploadSession}
     */
    public function storeDirect(Tenant $tenant, TenantUser $creator, UploadedFile $file, array $data): array
    {
        $intent = $this->createUploadIntent($tenant, $creator, array_merge($data, [
            'original_filename' => $file->getClientOriginalName() ?: ($data['original_filename'] ?? 'upload'),
            'mime_type' => $data['mime_type'] ?? ($file->getMimeType() ?: 'application/octet-stream'),
            'size_bytes' => $data['size_bytes'] ?? $file->getSize(),
        ]));

        $asset = $intent['asset'];
        $session = $intent['session'];
        $contents = $file->getContent();

        try {
            $this->assertNonVideoBytes($contents, $asset->mime_type);
            $written = $this->storage->put(
                $asset->storage_key,
                $contents,
                $asset->visibility === 'private' ? 'private' : 'public',
            );
            if (! $written) {
                throw new \RuntimeException('Unable to write the uploaded file to local storage.');
            }
        } catch (\Throwable $e) {
            $session->forceDelete();
            $asset->forceDelete();

            throw $e;
        }

        return $this->confirmUpload($tenant, $session, [
            'size_bytes' => $file->getSize(),
        ]);
    }

    /**
     * Accept raw bytes for a previously reserved local upload session.
     *
     * @return array{asset: MediaAsset, session: MediaUploadSession}
     */
    public function storeBytes(Tenant $tenant, MediaUploadSession $session, string $contents, ?int $size = null): array
    {
        $this->ensureSessionInTenant($tenant, $session);
        $this->ensureLocalSession($session);
        $this->ensureSessionCanAcceptBytes($session);

        $asset = $session->asset;
        if (! $asset) {
            throw ValidationException::withMessages([
                'session' => ['The upload session is not attached to a media asset.'],
            ]);
        }

        $this->assertNonVideoAsset($asset);
        $this->assertNonVideoBytes($contents, $asset->mime_type);

        $actualSize = strlen($contents);
        $expectedSize = (int) ($asset->size_bytes ?? 0);
        if (($expectedSize > 0 && $actualSize !== $expectedSize)
            || ($size !== null && $size > 0 && $actualSize !== $size)) {
            throw ValidationException::withMessages([
                'file' => ['Uploaded byte count does not match the declared file size.'],
            ]);
        }

        $written = $this->storage->put($asset->storage_key, $contents);
        if (! $written) {
            throw new \RuntimeException('Unable to write the uploaded file to local storage.');
        }

        return $this->confirmUpload($tenant, $session, [
            'size_bytes' => $actualSize,
        ]);
    }

    /**
     * @param array<string, mixed> $payload
     * @return array{asset: MediaAsset, session: MediaUploadSession, provider: array<string, mixed>}
     */
    public function confirmUpload(Tenant $tenant, MediaUploadSession $session, array $payload = []): array
    {
        $this->ensureSessionInTenant($tenant, $session);
        $this->ensureLocalSession($session);

        $asset = $session->asset;
        if (! $asset) {
            throw ValidationException::withMessages([
                'session' => ['The upload session is not attached to a media asset.'],
            ]);
        }

        if ($session->completed || $session->status === 'completed') {
            return [
                'asset' => $asset,
                'session' => $session,
                'provider' => $this->provider()->confirmUpload($session, $payload),
            ];
        }

        $this->ensureSessionCanAcceptBytes($session);
        $this->assertNonVideoAsset($asset);

        if (! $asset->storage_key || ! $this->storage->exists($asset->storage_key)) {
            throw ValidationException::withMessages([
                'file' => ['The uploaded file has not been stored yet.'],
            ]);
        }

        $providerResult = $this->provider()->confirmUpload($session, $payload);
        $checksum = $session->final_file_hash ?? $payload['checksum'] ?? $asset->checksum;

        $asset->forceFill([
            'status' => 'ready',
            'processing_status' => 'ready',
            'processing_progress' => 100,
            'size_bytes' => $this->storage->size($asset->storage_key),
            'checksum' => $checksum,
            // The URL is derived from the storage disk, never supplied by the client.
            'cdn_url' => $providerResult['url'] ?? $asset->cdn_url,
        ])->save();

        $session->forceFill([
            'status' => 'completed',
            'completed' => true,
            'expires_at' => null,
        ])->save();

        return [
            'asset' => $asset->refresh()->load(['folder', 'uploader']),
            'session' => $session->refresh(),
            'provider' => $providerResult,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function status(Tenant $tenant, MediaAsset $asset): array
    {
        if ($asset->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'asset' => ['Invalid asset for this tenant.'],
            ]);
        }

        return $this->provider()->getAssetStatus($asset);
    }

    /**
     * @return array<string, mixed>
     */
    public function signedUrl(MediaAsset $asset): array
    {
        return $this->provider()->createSignedReadUrl($asset);
    }

    private function provider(): \App\Contracts\Media\MediaProvider
    {
        return $this->manager->providerFor('local', 'storage');
    }

    private function ensureSessionCanAcceptBytes(MediaUploadSession $session): void
    {
        if ($session->completed || $session->status === 'completed') {
            throw ValidationException::withMessages([
                'session' => ['This upload session has already been completed.'],
            ]);
        }

        if ($session->isExpired()) {
            throw ValidationException::withMessages([
                'session' => ['This upload session has expired. Please start a new upload.'],
            ]);
        }
    }

    private function assertNonVideoAsset(MediaAsset $asset): void
    {
        if (MediaLibraryRouting::isVideoCandidate(
            (string) $asset->type,
            $asset->mime_type,
            (string) ($asset->original_filename ?? ''),
        )) {
            throw ValidationException::withMessages([
                'library' => ['Videos must be uploaded through the video library.'],
            ]);
        }
    }

    private function assertNonVideoBytes(string $contents, ?string $declaredMime): void
    {
        $detected = null;
        if (function_exists('finfo_open')) {
            $finfo = @finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo !== false) {
                $detected = finfo_buffer($finfo, $contents) ?: null;
                finfo_close($finfo);
            }
        }

        if (self::mimeLooksLikeVideo($detected) || self::mimeLooksLikeVideo($declaredMime)) {
            throw ValidationException::withMessages([
                'file' => ['Videos must be uploaded through the video library.'],
            ]);
        }
    }

    private static function mimeLooksLikeVideo(?string $mime): bool
    {
        return $mime !== null && str_starts_with(strtolower(trim($mime)), 'video/');
    }

    private function ensureSessionInTenant(Tenant $tenant, MediaUploadSession $session): void
    {
        if ($session->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'session' => ['The upload session is invalid for this tenant.'],
            ]);
        }
    }

    private function ensureLocalSession(MediaUploadSession $session): void
    {
        if ($session->provider !== 'local' || $session->provider_service !== 'storage') {
            throw ValidationException::withMessages([
                'session' => ['This upload session does not belong to the media library.'],
            ]);
        }
    }
}
