<?php

namespace App\Services\Media\Providers;

use App\Contracts\Media\MediaProvider;
use App\Models\MediaAsset;
use App\Models\MediaAssetVariant;
use App\Models\MediaUploadSession;
use App\Services\Media\MediaLibraryRouting;
use App\Services\Media\MediaStorage;

/**
 * Storage provider for the tenant's own media library.
 *
 * Images, audio, documents and every other non-video asset live here. This
 * provider never resolves Bunny credentials and never issues a Bunny request;
 * it only reads/writes the configured media disk.
 */
class LocalProvider implements MediaProvider
{
    public function __construct(
        private readonly MediaStorage $storage,
    ) {
    }

    public function createUploadIntent(MediaUploadSession $session, array $options = []): array
    {
        $asset = $session->asset;
        $routePrefix = request()?->attributes->get('instructorMembership')
            ? 'instructor/media-library'
            : 'media-library';

        return [
            'provider' => 'local',
            'provider_service' => 'storage',
            'method' => 'PUT',
            'upload_method' => 'PUT',
            'upload_url' => "/api/v1/{$routePrefix}/upload/local/{$session->id}",
            'storage_key' => $asset?->storage_key,
            'expires_at' => $session->expires_at,
            'headers' => [
                'Content-Type' => $asset?->mime_type ?: 'application/octet-stream',
            ],
            'metadata' => [
                'library' => MediaLibraryRouting::MEDIA,
            ],
        ];
    }

    public function confirmUpload(MediaUploadSession $session, array $payload = []): array
    {
        return [
            'provider' => 'local',
            'provider_service' => 'storage',
            'confirmed' => true,
            'storage_key' => $session->asset?->storage_key,
            'url' => $session->asset ? $this->urlFor($session->asset) : null,
            'payload' => $payload,
        ];
    }

    public function getAssetStatus(MediaAsset $asset): array
    {
        return [
            'provider' => 'local',
            'provider_service' => 'storage',
            'asset_id' => $asset->id,
            'status' => $asset->status,
            'processing_status' => $asset->processing_status,
            'storage_key' => $asset->storage_key,
            'exists' => $asset->storage_key ? $this->storage->exists($asset->storage_key) : false,
            'url' => $this->urlFor($asset),
        ];
    }

    public function createSignedReadUrl(MediaAsset $asset, array $options = []): array
    {
        return [
            'provider' => 'local',
            'provider_service' => 'storage',
            'url' => $this->urlFor($asset),
            'expires_at' => $options['expires_at'] ?? null,
        ];
    }

    public function deleteAsset(MediaAsset $asset): array
    {
        $storageKey = $asset->storage_key ?: $asset->bunny_storage_path;

        if (! $storageKey) {
            return [
                'provider' => 'local',
                'provider_service' => 'storage',
                'deleted' => true,
                'storage_key' => null,
                'skipped' => true,
                'reason' => 'No local storage key on asset.',
            ];
        }

        $this->storage->delete($storageKey);

        return [
            'provider' => 'local',
            'provider_service' => 'storage',
            'deleted' => true,
            'storage_key' => $storageKey,
        ];
    }

    public function createVariant(MediaAsset $asset, string $type, array $options = []): MediaAssetVariant|array
    {
        return [
            'provider' => 'local',
            'provider_service' => 'storage',
            'supported' => false,
            'reason' => 'Variant generation is reserved for a future media processing phase.',
            'asset_id' => $asset->id,
            'type' => $type,
        ];
    }

    public function getPlaybackData(MediaAsset $asset): array
    {
        return [
            'provider' => 'local',
            'provider_service' => 'storage',
            'supported' => false,
            'reason' => 'Playback data is not supported by the local media provider.',
        ];
    }

    private function urlFor(MediaAsset $asset): ?string
    {
        if ($asset->storage_key) {
            return $this->storage->url($asset->storage_key);
        }

        return $asset->cdn_url ?: null;
    }
}
