<?php

namespace App\Services\Media;

use App\Models\MediaAsset;
use App\Models\MediaUploadSession;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StorageUploadService
{
    private const STORAGE_ASSET_TYPES = ['image', 'document', 'pdf', 'archive', 'attachment', 'caption', 'thumbnail'];

    public function __construct(
        private readonly MediaLibraryService $media,
        private readonly MediaManager $manager,
        private readonly StoragePathGenerator $paths,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     * @return array{asset: MediaAsset, session: MediaUploadSession, intent: array<string, mixed>}
     */
    public function createUploadIntent(Tenant $tenant, TenantUser $creator, array $data): array
    {
        if (! in_array($data['type'], self::STORAGE_ASSET_TYPES, true)) {
            throw ValidationException::withMessages([
                'type' => ['The selected media type is not supported by storage uploads.'],
            ]);
        }

        $storageKey = $this->paths->generate($tenant, $data['storage_root'], $data['original_filename']);

        return DB::transaction(function () use ($tenant, $creator, $data, $storageKey): array {
            $asset = $this->media->createAsset($tenant, [
                'provider' => 'bunny',
                'provider_service' => 'storage',
                'type' => $data['type'],
                'status' => 'pending',
                'visibility' => $data['visibility'] ?? 'private',
                'storage_key' => $storageKey,
                'original_filename' => $data['original_filename'],
                'mime_type' => $data['mime_type'] ?? null,
                'size_bytes' => $data['size_bytes'] ?? null,
                'checksum' => $data['checksum'] ?? null,
                'metadata' => [
                    'storage_root' => $data['storage_root'],
                ],
            ], $creator);

            $session = $this->media->createUploadSession($tenant, [
                'media_asset_id' => $asset->id,
                'provider' => 'bunny',
                'provider_service' => 'storage',
                'status' => 'draft',
                'expires_at' => now()->addMinutes(30),
                'metadata' => [
                    'asset_type' => $asset->type,
                    'storage_key' => $asset->storage_key,
                    'storage_root' => $data['storage_root'],
                ],
            ], $creator);

            $intent = $this->manager->providerFor('bunny', 'storage')->createUploadIntent($session);

            return [
                'asset' => $asset->refresh(),
                'session' => $session->refresh(),
                'intent' => $intent,
            ];
        });
    }

    /**
     * @param array<string, mixed> $payload
     * @return array{asset: MediaAsset, session: MediaUploadSession, provider: array<string, mixed>}
     */
    public function confirmUpload(Tenant $tenant, MediaUploadSession $session, array $payload = []): array
    {
        $this->ensureSessionInTenant($tenant, $session);

        if (! $session->asset) {
            throw ValidationException::withMessages([
                'session' => ['The upload session is not attached to a media asset.'],
            ]);
        }

        $providerResult = $this->manager->providerFor($session->provider, $session->provider_service)->confirmUpload($session, $payload);

        $session->asset->forceFill([
            'status' => 'ready',
            'external_id' => $payload['external_id'] ?? $session->asset->external_id,
            'size_bytes' => $payload['size_bytes'] ?? $session->asset->size_bytes,
            'checksum' => $payload['checksum'] ?? $session->asset->checksum,
        ])->save();

        $session->forceFill([
            'status' => 'completed',
        ])->save();

        return [
            'asset' => $session->asset->refresh(),
            'session' => $session->refresh(),
            'provider' => $providerResult,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function status(Tenant $tenant, MediaAsset $asset): array
    {
        $this->ensureAssetInTenant($tenant, $asset);

        return $this->manager->providerFor($asset->provider, $asset->provider_service)->getAssetStatus($asset);
    }

    public function delete(Tenant $tenant, MediaAsset $asset): MediaAsset
    {
        $this->ensureAssetInTenant($tenant, $asset);

        $this->manager->providerFor($asset->provider, $asset->provider_service)->deleteAsset($asset);

        $asset->forceFill(['status' => 'deleted'])->save();

        return $asset->refresh();
    }

    private function ensureSessionInTenant(Tenant $tenant, MediaUploadSession $session): void
    {
        if ($session->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'session' => ['The upload session is invalid for this tenant.'],
            ]);
        }
    }

    private function ensureAssetInTenant(Tenant $tenant, MediaAsset $asset): void
    {
        if ($asset->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'asset' => ['The media asset is invalid for this tenant.'],
            ]);
        }
    }
}
