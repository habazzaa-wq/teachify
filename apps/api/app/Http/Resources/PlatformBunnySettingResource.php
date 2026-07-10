<?php

namespace App\Http\Resources;

use App\Models\PlatformBunnySetting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Serializes the platform Bunny settings.
 *
 * Secrets are NEVER returned decrypted. Only masked placeholders and presence
 * flags are exposed.
 *
 * @property PlatformBunnySetting $resource
 */
class PlatformBunnySettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $settings = $this->resource;

        return [
            'id' => $settings->id,
            'storageZoneName' => $settings->storage_zone_name,
            'storageZoneRegion' => $settings->storage_zone_region,
            'cdnHostname' => $settings->cdn_hostname,
            'libraryId' => $settings->library_id,
            'enabled' => (bool) $settings->enabled,
            'defaultPrivacy' => $settings->default_privacy,
            'defaultExpirationDays' => $settings->default_expiration_days,
            'maxUploadSize' => $settings->max_upload_size,
            'chunkSize' => $settings->chunk_size,
            'enableStream' => (bool) $settings->enable_stream,
            'enableCdn' => (bool) $settings->enable_cdn,
            'enableSignedUrls' => (bool) $settings->enable_signed_urls,
            'enableTranscoding' => (bool) $settings->enable_transcoding,
            'defaultThumbnailTime' => (int) $settings->default_thumbnail_time,
            'connectionStatus' => $settings->connection_status,
            'lastError' => $settings->last_error,
            'lastVerifiedAt' => $settings->last_verified_at?->toIso8601String(),
            'hasApiKey' => filled($settings->api_key),
            'hasStoragePassword' => filled($settings->storage_zone_password),
            'hasStreamApiKey' => filled($settings->stream_api_key),
            'hasSignedUrlSecret' => filled($settings->signed_url_secret),
            'apiKeyMasked' => $this->mask($settings->api_key),
            'streamApiKeyMasked' => $this->mask($settings->stream_api_key),
            'storageZonePasswordMasked' => $this->mask($settings->storage_zone_password),
            'signedUrlSecretMasked' => $this->mask($settings->signed_url_secret),
            'metadata' => $settings->metadata,
        ];
    }

    private function mask(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $len = strlen($value);

        if ($len <= 8) {
            return str_repeat('•', $len);
        }

        return substr($value, 0, 4).str_repeat('•', max(4, $len - 8)).substr($value, -4);
    }
}
