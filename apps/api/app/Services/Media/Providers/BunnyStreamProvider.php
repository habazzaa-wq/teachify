<?php

namespace App\Services\Media\Providers;

use App\Contracts\Media\MediaProvider;
use App\Exceptions\MediaProviderException;
use App\Models\MediaAsset;
use App\Models\MediaAssetVariant;
use App\Models\MediaUploadSession;
use App\Models\PlatformBunnySetting;
use App\Models\TenantIntegration;
use App\Services\Bunny\Contracts\BunnyStreamInterface;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class BunnyStreamProvider implements MediaProvider
{
    public function createUploadIntent(MediaUploadSession $session, array $options = []): array
    {
        $config = $this->config($session->tenant_id);
        $asset = $session->asset;
        $videoId = $asset?->external_id ?: (string) Str::uuid();
        $libraryId = (string) $config['library_id'];
        $apiRegion = trim((string) ($config['api_region'] ?? 'video'), '/');
        $baseUrl = str_starts_with($apiRegion, 'http')
            ? rtrim($apiRegion, '/')
            : "https://{$apiRegion}.bunnycdn.com";

        return [
            'provider' => 'bunny',
            'provider_service' => 'stream',
            'method' => 'PUT',
            'upload_url' => "{$baseUrl}/library/{$libraryId}/videos/{$videoId}",
            'video_id' => $videoId,
            'library_id' => $libraryId,
            'expires_at' => $session->expires_at,
            'headers' => [
                'AccessKey' => $config['client_upload_key'] ?? null,
                'Content-Type' => $asset?->mime_type ?: 'video/mp4',
            ],
            'metadata' => [
                'collection' => $asset?->metadata['collection'] ?? null,
            ],
        ];
    }

    public function confirmUpload(MediaUploadSession $session, array $payload = []): array
    {
        return [
            'provider' => 'bunny',
            'provider_service' => 'stream',
            'confirmed' => true,
            'video_id' => $payload['bunny_video_id'] ?? $payload['video_id'] ?? $session->asset?->external_id,
            'encoding_status' => $payload['encoding_status'] ?? $payload['status'] ?? 'Uploaded',
        ];
    }

    public function getAssetStatus(MediaAsset $asset): array
    {
        return [
            'provider' => 'bunny',
            'provider_service' => 'stream',
            'asset_id' => $asset->id,
            'video_id' => $asset->external_id,
            'status' => $asset->status,
            'encoding_status' => $asset->metadata['encoding_status'] ?? null,
            'metadata' => $asset->metadata ?? [],
        ];
    }

    public function createSignedReadUrl(MediaAsset $asset, array $options = []): array
    {
        throw new MediaProviderException(
            'Signed playback URLs are not implemented for Bunny Stream foundation.',
            'bunny',
            'stream',
            'createSignedReadUrl',
            ['asset_id' => $asset->id],
        );
    }

    public function deleteAsset(MediaAsset $asset): array
    {
        $videoId = $asset->bunny_video_id ?: $asset->external_id;

        if (! $videoId) {
            return [
                'provider' => 'bunny',
                'provider_service' => 'stream',
                'deleted' => true,
                'video_id' => null,
                'skipped' => true,
                'reason' => 'No video ID on asset.',
            ];
        }

        app(BunnyStreamInterface::class)->deleteVideo($videoId);

        return [
            'provider' => 'bunny',
            'provider_service' => 'stream',
            'deleted' => true,
            'video_id' => $videoId,
        ];
    }

    public function createVariant(MediaAsset $asset, string $type, array $options = []): MediaAssetVariant|array
    {
        throw new MediaProviderException(
            'Bunny Stream variant management is not implemented in the foundation module.',
            'bunny',
            'stream',
            'createVariant',
            ['asset_id' => $asset->id, 'type' => $type],
        );
    }

    public function getPlaybackData(MediaAsset $asset): array
    {
        $config = $this->config($asset->tenant_id);
        $pullZone = $config['pull_zone'] ?? null;
        $videoId = (string) $asset->external_id;

        $playbackUrl = null;
        $status = null;

        try {
            $status = app(BunnyStreamInterface::class)->getVideoStatus($videoId);
            $playbackUrl = $status['playback_url'] ?? null;
        } catch (Throwable) {
            // Stream API unavailable (not configured, transient failure) —
            // fall back to the configured pull zone below.
        }

        if ($playbackUrl === null && filled($pullZone)) {
            $playbackUrl = 'https://'.trim((string) $pullZone, '/').'/'.$videoId.'/playlist.m3u8';
        }

        return [
            'provider' => 'bunny',
            'provider_service' => 'stream',
            'video_id' => $videoId,
            'playback_url' => $playbackUrl,
            'thumbnail_url' => $status['thumbnail_url'] ?? ($asset->metadata['thumbnail_url'] ?? null),
            'duration_seconds' => $status['duration'] ?? ($asset->metadata['duration_seconds'] ?? null),
            'available_resolutions' => $status['resolutions'] ?? ($asset->metadata['available_resolutions'] ?? []),
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
            ->where('service', 'stream')
            ->whereIn('status', ['pending', 'active'])
            ->first();

        $platform = PlatformBunnySetting::active();

        if ($integration) {
            $config = $integration->config ?? [];

            // If the tenant integration config already has a stream library,
            // use it directly.
            if (! empty($config['library_id'])) {
                return $config;
            }

            // Merge platform-wide Stream settings underneath tenant-specific
            // config so per-tenant overrides (e.g. collection prefix) apply.
            if ($platform && $platform->hasStreamCredentials()) {
                return array_merge($platform->toProviderConfig('stream'), $config);
            }

            return $config;
        }

        if ($platform && $platform->hasStreamCredentials()) {
            return $platform->toProviderConfig('stream');
        }

        throw new RuntimeException('Bunny Stream integration is not configured for this tenant.');
    }
}
