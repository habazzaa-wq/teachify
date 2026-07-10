<?php

namespace App\Repositories;

use App\Models\PlatformBunnySetting;

/**
 * Repository for the singleton platform Bunny settings row.
 *
 * This is global (platform-wide) and therefore intentionally does NOT scope
 * by tenant, unlike most other repositories in the codebase.
 */
class PlatformBunnySettingRepository
{
    /**
     * Return the single settings row or a fresh instance.
     */
    public function getOrNew(): PlatformBunnySetting
    {
        return PlatformBunnySetting::query()->first() ?? new PlatformBunnySetting();
    }

    public function getActive(): ?PlatformBunnySetting
    {
        return PlatformBunnySetting::query()->first();
    }

    /**
     * Persist settings, creating the row on first use.
     *
     * @param array<string, mixed> $data
     */
    public function update(array $data): PlatformBunnySetting
    {
        $settings = PlatformBunnySetting::query()->first() ?? new PlatformBunnySetting();

        $settings->fill(collect($data)->only($settings->getFillable())->all());
        $settings->save();

        return $settings->refresh();
    }

    /**
     * Record the result of a connection verification.
     *
     * @param array{status: string, error?: string|null, verified_at?: string|null} $result
     */
    public function recordVerification(array $result): PlatformBunnySetting
    {
        $settings = $this->getOrNew();

        $settings->connection_status = $result['status'];
        $settings->last_error = $result['error'] ?? null;
        $settings->last_verified_at = $result['verified_at'] ?? now();
        $settings->save();

        return $settings->refresh();
    }

    /**
     * Clear only the credential fields (keeps feature toggles intact).
     */
    public function deleteCredentials(): PlatformBunnySetting
    {
        $settings = $this->getOrNew();

        $settings->forceFill([
            'storage_zone_password' => null,
            'api_key' => null,
            'stream_api_key' => null,
            'signed_url_secret' => null,
            'connection_status' => PlatformBunnySetting::CONNECTION_DISCONNECTED,
            'last_error' => null,
            'last_verified_at' => null,
        ]);
        $settings->save();

        return $settings->refresh();
    }

    /**
     * Reset every value back to platform defaults (Danger Zone).
     */
    public function reset(): PlatformBunnySetting
    {
        $settings = PlatformBunnySetting::query()->first();

        if ($settings) {
            $settings->forceFill([
                'storage_zone_name' => null,
                'storage_zone_password' => null,
                'storage_zone_region' => 'de',
                'cdn_hostname' => null,
                'library_id' => null,
                'api_key' => null,
                'stream_api_key' => null,
                'signed_url_secret' => null,
                'enabled' => false,
                'default_privacy' => 'private',
                'default_expiration_days' => null,
                'max_upload_size' => null,
                'chunk_size' => null,
                'enable_stream' => false,
                'enable_cdn' => false,
                'enable_signed_urls' => false,
                'enable_transcoding' => false,
                'default_thumbnail_time' => 0,
                'connection_status' => PlatformBunnySetting::CONNECTION_DISCONNECTED,
                'last_error' => null,
                'last_verified_at' => null,
                'metadata' => null,
            ]);
            $settings->save();
        }

        return $this->getOrNew();
    }
}
