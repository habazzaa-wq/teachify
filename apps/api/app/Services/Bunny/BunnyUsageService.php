<?php

namespace App\Services\Bunny;

use App\Services\Bunny\Contracts\BunnyUsageInterface;

class BunnyUsageService implements BunnyUsageInterface
{
    public function __construct(
        private readonly BunnyClient $client,
        private readonly BunnyCacheService $cache,
    ) {
    }

    public function getCurrentStorage(): array
    {
        return $this->cache->cacheUsage('current_storage', function () {
            $result = $this->client->storageRequest('GET', '', [
                'operation' => 'get_current_storage',
                'timeout' => 15,
            ]);

            return [
                'storage_zone' => $this->client->settings()->storage_zone_name,
                'storage_used_bytes' => $result['StorageZoneSize'] ?? $result['storageZoneSize'] ?? 0,
                'files_count' => $result['FilesStored'] ?? $result['filesStored'] ?? 0,
                'pull_zone_bandwidth_used' => $result['PullZoneBandwidthUsed'] ?? $result['pullZoneBandwidthUsed'] ?? 0,
                'pull_zone_traffic_used' => $result['PullZoneTrafficUsed'] ?? $result['pullZoneTrafficUsed'] ?? 0,
            ];
        });
    }

    public function getBandwidth(): array
    {
        return $this->cache->cacheUsage('bandwidth', function () {
            $result = $this->client->storageRequest('GET', '', [
                'operation' => 'get_bandwidth',
                'timeout' => 15,
            ]);

            return [
                'bandwidth_used_bytes' => $result['BandwidthUsed'] ?? $result['bandwidthUsed'] ?? 0,
                'bandwidth_limit_bytes' => $result['BandwidthLimit'] ?? $result['bandwidthLimit'] ?? null,
                'bandwidth_percentage' => $result['BandwidthPercentage'] ?? $result['bandwidthPercentage'] ?? null,
            ];
        });
    }

    public function getViews(): array
    {
        return $this->cache->cacheUsage('views', function () {
            $result = $this->client->storageRequest('GET', '', [
                'operation' => 'get_views',
                'timeout' => 15,
            ]);

            return [
                'requests_served' => $result['RequestsServed'] ?? $result['requestsServed'] ?? 0,
                'requests_limit' => $result['RequestsLimit'] ?? $result['requestsLimit'] ?? null,
            ];
        });
    }

    public function getRequests(): array
    {
        return $this->getViews();
    }

    public function getCdnUsage(): array
    {
        return $this->cache->cacheUsage('cdn', function () {
            $result = $this->client->storageRequest('GET', '', [
                'operation' => 'get_cdn_usage',
                'timeout' => 15,
            ]);

            return [
                'pull_zone_bandwidth_used' => $result['PullZoneBandwidthUsed'] ?? $result['pullZoneBandwidthUsed'] ?? 0,
                'pull_zone_traffic_used' => $result['PullZoneTrafficUsed'] ?? $result['pullZoneTrafficUsed'] ?? 0,
                'requests_served' => $result['RequestsServed'] ?? $result['requestsServed'] ?? 0,
            ];
        });
    }

    public function getStorageUsage(): array
    {
        $storage = $this->getCurrentStorage();

        return [
            'storage_used_bytes' => $storage['storage_used_bytes'],
            'files_count' => $storage['files_count'],
            'storage_zone' => $storage['storage_zone'],
        ];
    }

    public function getStreamingUsage(): array
    {
        return $this->cache->cacheUsage('streaming', function () {
            $settings = $this->client->settings();

            if (! $settings->hasStreamCredentials()) {
                return [
                    'library_id' => null,
                    'enabled' => false,
                    'videos_count' => 0,
                    'storage_used_bytes' => 0,
                    'bandwidth_used_bytes' => 0,
                ];
            }

            $libraryId = (string) $settings->library_id;

            $libraryResult = $this->client->streamRequest('GET', "library/{$libraryId}", [
                'operation' => 'get_streaming_usage',
                'timeout' => 15,
            ]);

            return [
                'library_id' => $libraryId,
                'enabled' => true,
                'videos_count' => $libraryResult['TotalVideos'] ?? $libraryResult['totalVideos'] ?? 0,
                'storage_used_bytes' => $libraryResult['StorageUsed'] ?? $libraryResult['storageUsed'] ?? 0,
                'bandwidth_used_bytes' => $libraryResult['BandwidthUsed'] ?? $libraryResult['bandwidthUsed'] ?? 0,
                'total_encoded_size_bytes' => $libraryResult['TotalEncodedSize'] ?? $libraryResult['totalEncodedSize'] ?? 0,
                'replication_region' => $libraryResult['ReplicationRegion'] ?? $libraryResult['replicationRegion'] ?? null,
            ];
        });
    }

    public function getDailyUsage(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $from = $dateFrom ?? now()->subDays(30)->format('Y-m-d');
        $to = $dateTo ?? now()->format('Y-m-d');

        return $this->cache->cacheUsage("daily:{$from}:{$to}", function () use ($from, $to) {
            $settings = $this->client->settings();

            $result = $this->client->storageRequest('GET', '', [
                'operation' => 'get_daily_usage',
                'timeout' => 15,
            ]);

            return [
                'period' => ['from' => $from, 'to' => $to],
                'storage_zone' => $settings->storage_zone_name,
                'storage_used_bytes' => $result['StorageZoneSize'] ?? 0,
                'bandwidth_used_bytes' => $result['BandwidthUsed'] ?? 0,
                'requests_served' => $result['RequestsServed'] ?? 0,
            ];
        });
    }

    public function getMonthlyUsage(?int $year = null, ?int $month = null): array
    {
        $year = $year ?? (int) now()->format('Y');
        $month = $month ?? (int) now()->format('m');

        return $this->cache->cacheUsage("monthly:{$year}:{$month}", function () use ($year, $month) {
            $result = $this->client->storageRequest('GET', '', [
                'operation' => 'get_monthly_usage',
                'timeout' => 15,
            ]);

            return [
                'year' => $year,
                'month' => $month,
                'storage_used_bytes' => $result['StorageZoneSize'] ?? 0,
                'bandwidth_used_bytes' => $result['BandwidthUsed'] ?? 0,
                'requests_served' => $result['RequestsServed'] ?? 0,
            ];
        });
    }

    public function getTenantUsage(int $tenantId): array
    {
        return $this->cache->cacheUsage("tenant:{$tenantId}", function () use ($tenantId) {
            $settings = $this->client->settings();

            $storageUsage = $this->getCurrentStorage();
            $streamingUsage = $this->getStreamingUsage();

            return [
                'tenant_id' => $tenantId,
                'storage_zone' => $settings->storage_zone_name,
                'platform_storage_bytes' => $storageUsage['storage_used_bytes'],
                'platform_files_count' => $storageUsage['files_count'],
                'platform_streaming_bytes' => $streamingUsage['storage_used_bytes'],
                'tenant_path_prefix' => "tenants/{$tenantId}/",
            ];
        });
    }

    public function getPlatformUsage(): array
    {
        return $this->cache->cacheUsage('platform', function () {
            $storage = $this->getCurrentStorage();
            $bandwidth = $this->getBandwidth();
            $views = $this->getViews();
            $streaming = $this->getStreamingUsage();

            return [
                'storage' => $storage,
                'bandwidth' => $bandwidth,
                'views' => $views,
                'streaming' => $streaming,
                'aggregated_at' => now()->toIso8601String(),
            ];
        });
    }
}
