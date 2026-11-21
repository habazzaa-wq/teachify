<?php

namespace App\Services\Media\Providers;

use App\Contracts\Media\MediaProvider;
use App\Models\MediaAsset;
use App\Models\MediaAssetVariant;
use App\Models\MediaUploadSession;
use App\Services\Media\MediaStorage;

class LocalStorageProvider implements MediaProvider
{
    public function __construct(private readonly MediaStorage $storage)
    {
    }

    public function createUploadIntent(MediaUploadSession $session, array $options = []): array
    {
        $asset = $session->asset;

        return [
            'provider' => 'local',
            'provider_service' => 'storage',
            'method' => 'PUT',
            'upload_url' => null,
            'storage_key' => $asset?->storage_key,
            'expires_at' => $session->expires_at,
            'headers' => [],
            'metadata' => [
                'disk' => $this->storage->diskName(),
            ],
        ];
    }

    public function confirmUpload(MediaUploadSession $session, array $payload = []): array
    {
        $asset = $session->asset;
        $url = $asset?->storage_key ? $this->storage->url($asset->storage_key) : null;

        return [
            'provider' => 'local',
            'provider_service' => 'storage',
            'confirmed' => true,
            'storage_key' => $asset?->storage_key,
            'url' => $url,
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
            'storage_key' => $asset->storage_key,
            'external_id' => $asset->external_id,
        ];
    }

    public function createSignedReadUrl(MediaAsset $asset, array $options = []): array
    {
        $url = $asset->storage_key ? $this->storage->url($asset->storage_key) : null;

        return [
            'provider' => 'local',
            'provider_service' => 'storage',
            'url' => $url,
            'expires_at' => $options['expires_at'] ?? null,
        ];
    }

    public function deleteAsset(MediaAsset $asset): array
    {
        $key = $asset->storage_key ?: $asset->bunny_storage_path;

        if ($key) {
            $this->storage->delete($key);
        }

        return [
            'provider' => 'local',
            'provider_service' => 'storage',
            'deleted' => true,
            'storage_key' => $key,
        ];
    }

    public function createVariant(MediaAsset $asset, string $type, array $options = []): MediaAssetVariant|array
    {
        return [
            'provider' => 'local',
            'provider_service' => 'storage',
            'supported' => false,
            'reason' => 'Variant generation is not implemented for local storage.',
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
            'reason' => 'Playback data is not supported by local storage.',
        ];
    }
}
