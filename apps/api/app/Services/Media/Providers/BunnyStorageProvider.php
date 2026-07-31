<?php

namespace App\Services\Media\Providers;

use App\Contracts\Media\MediaProvider;
use App\Models\MediaAsset;
use App\Models\MediaAssetVariant;
use App\Models\MediaUploadSession;
use App\Models\PlatformBunnySetting;
use App\Models\TenantIntegration;
use RuntimeException;

class BunnyStorageProvider implements MediaProvider
{
    public function createUploadIntent(MediaUploadSession $session, array $options = []): array
    {
        $config = $this->config($session->tenant_id);
        $asset = $session->asset;

        return [
            'provider' => 'bunny',
            'provider_service' => 'storage',
            'method' => 'PUT',
            'upload_url' => rtrim((string) ($config['upload_base_url'] ?? ''), '/').'/'.ltrim((string) $asset?->storage_key, '/'),
            'storage_key' => $asset?->storage_key,
            'expires_at' => $session->expires_at,
            'headers' => [
                'AccessKey' => $config['client_upload_key'] ?? null,
                'Content-Type' => $asset?->mime_type,
            ],
            'metadata' => [
                'zone' => $config['zone'] ?? null,
            ],
        ];
    }

    public function confirmUpload(MediaUploadSession $session, array $payload = []): array
    {
        return [
            'provider' => 'bunny',
            'provider_service' => 'storage',
            'confirmed' => true,
            'storage_key' => $session->asset?->storage_key,
            'payload' => $payload,
        ];
    }

    public function getAssetStatus(MediaAsset $asset): array
    {
        return [
            'provider' => 'bunny',
            'provider_service' => 'storage',
            'asset_id' => $asset->id,
            'status' => $asset->status,
            'storage_key' => $asset->storage_key,
            'external_id' => $asset->external_id,
        ];
    }

    public function createSignedReadUrl(MediaAsset $asset, array $options = []): array
    {
        $config = $this->config($asset->tenant_id);

        $url = rtrim((string) ($config['cdn_base_url'] ?? ''), '/')
            .'/'.ltrim((string) $asset->storage_key, '/');

        // Defensive: never emit a protocol-less URL — browsers would resolve it
        // against the current origin and image previews would silently break.
        if ($url !== '' && ! preg_match('#^[a-z][a-z0-9+.\-]*://#i', $url)) {
            $url = 'https://'.$url;
        }

        return [
            'provider' => 'bunny',
            'provider_service' => 'storage',
            'url' => $url,
            'expires_at' => $options['expires_at'] ?? null,
        ];
    }

    public function deleteAsset(MediaAsset $asset): array
    {
        $storageKey = $asset->bunny_storage_path ?: $asset->storage_key;

        if (! $storageKey) {
            return [
                'provider' => 'bunny',
                'provider_service' => 'storage',
                'deleted' => true,
                'storage_key' => null,
                'skipped' => true,
                'reason' => 'No storage key on asset.',
            ];
        }

        app(\App\Services\Bunny\Contracts\BunnyStorageInterface::class)->deleteFile($storageKey);

        return [
            'provider' => 'bunny',
            'provider_service' => 'storage',
            'deleted' => true,
            'storage_key' => $storageKey,
        ];
    }

    public function createVariant(MediaAsset $asset, string $type, array $options = []): MediaAssetVariant|array
    {
        return [
            'provider' => 'bunny',
            'provider_service' => 'storage',
            'supported' => false,
            'reason' => 'Variant generation is reserved for a future image processing phase.',
            'asset_id' => $asset->id,
            'type' => $type,
        ];
    }

    public function getPlaybackData(MediaAsset $asset): array
    {
        return [
            'provider' => 'bunny',
            'provider_service' => 'storage',
            'supported' => false,
            'reason' => 'Playback data is not supported by Bunny Storage.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function config(int $tenantId): array
    {
        $integration = TenantIntegration::query()
            ->where('tenant_id', $tenantId)
            ->where('provider', 'bunny')
            ->where('service', 'storage')
            ->whereIn('status', ['pending', 'active'])
            ->first();

        $platform = PlatformBunnySetting::active();

        if ($integration) {
            $config = $integration->config ?? [];

            // If the tenant integration config already has storage credentials,
            // use it directly. Otherwise fall back to the platform-wide settings.
            if (! empty($config['upload_base_url']) && ! empty($config['client_upload_key'])) {
                return $config;
            }

            // Merge platform settings underneath tenant-specific config so that
            // per-tenant overrides (e.g. paths) still apply.
            if ($platform && $platform->hasStorageCredentials()) {
                return array_merge($platform->toProviderConfig('storage'), $config);
            }

            return $config;
        }

        if ($platform && $platform->hasStorageCredentials()) {
            return $platform->toProviderConfig('storage');
        }

        throw new RuntimeException('Bunny Storage integration is not configured for this tenant.');
    }
}
