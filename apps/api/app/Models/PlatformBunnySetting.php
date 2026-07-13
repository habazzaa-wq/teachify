<?php

namespace App\Models;

use App\Casts\Encrypted;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Platform-wide Bunny.net integration settings.
 *
 * There is exactly ONE Bunny account for the entire platform. All tenants
 * upload through this account. The credentials are encrypted at rest via the
 * {@see Encrypted} cast and are never serialized in API resources.
 */
class PlatformBunnySetting extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'storage_zone_name',
        'storage_zone_password',
        'storage_zone_region',
        'cdn_hostname',
        'library_id',
        'api_key',
        'stream_api_key',
        'signed_url_secret',
        'enabled',
        'default_privacy',
        'default_expiration_days',
        'max_upload_size',
        'chunk_size',
            'enable_stream',
            'enable_cdn',
            'enable_signed_urls',
            'enable_transcoding',
            'enable_resumable_upload',
            'enable_duplicate_detection',
            'enable_checksum_validation',
        'default_thumbnail_time',
        'connection_status',
        'last_error',
        'last_verified_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'storage_zone_password' => Encrypted::class,
            'api_key' => Encrypted::class,
            'stream_api_key' => Encrypted::class,
            'signed_url_secret' => Encrypted::class,
            'enabled' => 'boolean',
            'enable_stream' => 'boolean',
            'enable_cdn' => 'boolean',
            'enable_signed_urls' => 'boolean',
            'enable_transcoding' => 'boolean',
            'enable_resumable_upload' => 'boolean',
            'enable_duplicate_detection' => 'boolean',
            'enable_checksum_validation' => 'boolean',
            'default_expiration_days' => 'integer',
            'max_upload_size' => 'integer',
            'chunk_size' => 'integer',
            'default_thumbnail_time' => 'integer',
            'last_verified_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public const CONNECTION_CONNECTED = 'connected';
    public const CONNECTION_DISCONNECTED = 'disconnected';
    public const CONNECTION_UNAUTHORIZED = 'unauthorized';
    public const CONNECTION_REGION_ERROR = 'region_error';
    public const CONNECTION_STORAGE_MISSING = 'storage_missing';
    public const CONNECTION_LIBRARY_MISSING = 'library_missing';
    public const CONNECTION_API_ERROR = 'api_error';
    public const CONNECTION_TIMEOUT = 'timeout';

    /**
     * Return the singleton platform settings row (or null when unconfigured).
     */
    public static function active(): ?self
    {
        return static::query()->first();
    }

    public function scopeEnabled(Builder $query): Builder
    {
        return $query->where('enabled', true);
    }

    public function isConnected(): bool
    {
        return $this->connection_status === self::CONNECTION_CONNECTED;
    }

    public function hasStorageCredentials(): bool
    {
        return filled($this->storage_zone_name)
            && filled($this->storage_zone_password)
            && filled($this->api_key);
    }

    public function hasStreamCredentials(): bool
    {
        return filled($this->library_id) && filled($this->stream_api_key);
    }

    /**
     * Resolve the configuration consumed by the media providers.
     *
     * This is the single source of truth for the platform-wide Bunny account.
     *
     * @return array<string, mixed>
     */
    public function toProviderConfig(string $service): array
    {
        $region = strtolower(trim((string) ($this->storage_zone_region ?: 'de')));

        $base = [
            'provider' => 'bunny',
            'service' => $service,
            'region' => $region,
            'api_key' => $this->api_key,
            'client_upload_key' => $this->storage_zone_password,
            'storage_zone_name' => $this->storage_zone_name,
            'zone' => $this->storage_zone_name,
            'password' => $this->storage_zone_password,
            'cdn_base_url' => $this->cdn_hostname
                ? rtrim($this->cdn_hostname, '/')
                : "https://{$this->storage_zone_name}.b-cdn.net",
            'upload_base_url' => "https://{$this->storageHost($region)}/{$this->storage_zone_name}",
        ];

        if ($service === 'stream') {
            $base['library_id'] = $this->library_id;
            $base['api_region'] = match ($region) {
                'uk', 'gb' => 'uk.bunnycdn.com',
                'sg' => 'sg.bunnycdn.com',
                'la' => 'la.bunnycdn.com',
                'ny' => 'ny.bunnycdn.com',
                default => 'video.bunnycdn.com',
            };
            $base['client_upload_key'] = $this->stream_api_key;
            $base['api_key'] = $this->stream_api_key;
            $base['pull_zone'] = $this->cdn_hostname;
            $base['collection_prefix'] = 'platform';
        }

        return $base;
    }

    private function storageHost(string $region): string
    {
        $map = [
            'de' => 'storage.bunnycdn.com',
            'uk' => 'uk.storage.bunnycdn.com',
            'gb' => 'uk.storage.bunnycdn.com',
            'ny' => 'ny.storage.bunnycdn.com',
            'la' => 'la.storage.bunnycdn.com',
            'sg' => 'sg.storage.bunnycdn.com',
            'se' => 'se.storage.bunnycdn.com',
            'br' => 'br.storage.bunnycdn.com',
            'jh' => 'jh.storage.bunnycdn.com',
            'za' => 'jh.storage.bunnycdn.com',
            'syd' => 'syd.storage.bunnycdn.com',
            'au' => 'syd.storage.bunnycdn.com',
        ];

        return $map[$region] ?? $map['de'];
    }
}
