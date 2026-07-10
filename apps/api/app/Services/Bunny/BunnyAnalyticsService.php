<?php

namespace App\Services\Bunny;

use App\Services\Bunny\Contracts\BunnyAnalyticsInterface;

class BunnyAnalyticsService implements BunnyAnalyticsInterface
{
    private const EMPTY_RESULT = ['data' => [], 'note' => 'Pull zone not configured for analytics.'];

    public function __construct(
        private readonly BunnyClient $client,
        private readonly BunnyCacheService $cache,
    ) {
    }

    public function getStorageOverTime(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $key = $this->dateRangeKey('storage_over_time', $dateFrom, $dateTo);

        return $this->cache->cacheUsage($key, function () use ($dateFrom, $dateTo) {
            $pullZoneId = $this->resolvePullZoneId();

            if ($pullZoneId === null) {
                return self::EMPTY_RESULT;
            }

            $params = $this->buildDateParams($dateFrom, $dateTo);

            return $this->client->storageRequest('GET', "pullzone/{$pullZoneId}/analytics/storage?{$params}", [
                'operation' => 'get_storage_over_time',
                'timeout' => 15,
            ]);
        });
    }

    public function getBandwidthOverTime(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $key = $this->dateRangeKey('bandwidth_over_time', $dateFrom, $dateTo);

        return $this->cache->cacheUsage($key, function () use ($dateFrom, $dateTo) {
            $pullZoneId = $this->resolvePullZoneId();

            if ($pullZoneId === null) {
                return self::EMPTY_RESULT;
            }

            $params = $this->buildDateParams($dateFrom, $dateTo);

            return $this->client->storageRequest('GET', "pullzone/{$pullZoneId}/analytics/bandwidth?{$params}", [
                'operation' => 'get_bandwidth_over_time',
                'timeout' => 15,
            ]);
        });
    }

    public function getViews(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $key = $this->dateRangeKey('views', $dateFrom, $dateTo);

        return $this->cache->cacheUsage($key, function () use ($dateFrom, $dateTo) {
            $pullZoneId = $this->resolvePullZoneId();

            if ($pullZoneId === null) {
                return self::EMPTY_RESULT;
            }

            $params = $this->buildDateParams($dateFrom, $dateTo);

            return $this->client->storageRequest('GET', "pullzone/{$pullZoneId}/analytics/requests?{$params}", [
                'operation' => 'get_views',
                'timeout' => 15,
            ]);
        });
    }

    public function getCountries(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $key = $this->dateRangeKey('countries', $dateFrom, $dateTo);

        return $this->cache->cacheUsage($key, function () use ($dateFrom, $dateTo) {
            $pullZoneId = $this->resolvePullZoneId();

            if ($pullZoneId === null) {
                return self::EMPTY_RESULT;
            }

            $params = $this->buildDateParams($dateFrom, $dateTo);

            return $this->client->storageRequest('GET', "pullzone/{$pullZoneId}/analytics/countries?{$params}", [
                'operation' => 'get_countries',
                'timeout' => 15,
            ]);
        });
    }

    public function getDevices(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $key = $this->dateRangeKey('devices', $dateFrom, $dateTo);

        return $this->cache->cacheUsage($key, function () use ($dateFrom, $dateTo) {
            $pullZoneId = $this->resolvePullZoneId();

            if ($pullZoneId === null) {
                return self::EMPTY_RESULT;
            }

            $params = $this->buildDateParams($dateFrom, $dateTo);

            return $this->client->storageRequest('GET', "pullzone/{$pullZoneId}/analytics/devices?{$params}", [
                'operation' => 'get_devices',
                'timeout' => 15,
            ]);
        });
    }

    public function getBrowsers(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $key = $this->dateRangeKey('browsers', $dateFrom, $dateTo);

        return $this->cache->cacheUsage($key, function () use ($dateFrom, $dateTo) {
            $pullZoneId = $this->resolvePullZoneId();

            if ($pullZoneId === null) {
                return self::EMPTY_RESULT;
            }

            $params = $this->buildDateParams($dateFrom, $dateTo);

            return $this->client->storageRequest('GET', "pullzone/{$pullZoneId}/analytics/browsers?{$params}", [
                'operation' => 'get_browsers',
                'timeout' => 15,
            ]);
        });
    }

    public function getOperatingSystems(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $key = $this->dateRangeKey('operating_systems', $dateFrom, $dateTo);

        return $this->cache->cacheUsage($key, function () use ($dateFrom, $dateTo) {
            $pullZoneId = $this->resolvePullZoneId();

            if ($pullZoneId === null) {
                return self::EMPTY_RESULT;
            }

            $params = $this->buildDateParams($dateFrom, $dateTo);

            return $this->client->storageRequest('GET', "pullzone/{$pullZoneId}/analytics/operatingSystems?{$params}", [
                'operation' => 'get_operating_systems',
                'timeout' => 15,
            ]);
        });
    }

    public function getTopFiles(?string $dateFrom = null, ?string $dateTo = null, int $limit = 10): array
    {
        $key = $this->dateRangeKey("top_files:{$limit}", $dateFrom, $dateTo);

        return $this->cache->cacheUsage($key, function () use ($dateFrom, $dateTo) {
            $pullZoneId = $this->resolvePullZoneId();

            if ($pullZoneId === null) {
                return self::EMPTY_RESULT;
            }

            $params = $this->buildDateParams($dateFrom, $dateTo, ['statistics' => 'Requests']);

            return $this->client->storageRequest('GET', "pullzone/{$pullZoneId}/analytics/topFiles?{$params}", [
                'operation' => 'get_top_files',
                'timeout' => 15,
            ]);
        });
    }

    public function getTopVideos(?string $dateFrom = null, ?string $dateTo = null, int $limit = 10): array
    {
        $key = $this->dateRangeKey("top_videos:{$limit}", $dateFrom, $dateTo);

        return $this->cache->cacheUsage($key, function () use ($dateFrom, $dateTo) {
            $libraryId = $this->client->settings()->library_id;

            if (! $libraryId) {
                return ['data' => [], 'note' => 'No stream library configured for analytics.'];
            }

            $params = $this->buildDateParams($dateFrom, $dateTo);

            return $this->client->streamRequest('GET', "library/{$libraryId}/analytics/topVideos?{$params}", [
                'operation' => 'get_top_videos',
                'timeout' => 15,
            ]);
        });
    }

    public function getMostExpensiveAssets(?string $dateFrom = null, ?string $dateTo = null, int $limit = 10): array
    {
        $key = $this->dateRangeKey("most_expensive:{$limit}", $dateFrom, $dateTo);

        return $this->cache->cacheUsage($key, function () use ($dateFrom, $dateTo) {
            $pullZoneId = $this->resolvePullZoneId();

            if ($pullZoneId === null) {
                return self::EMPTY_RESULT;
            }

            $params = $this->buildDateParams($dateFrom, $dateTo, ['statistics' => 'Bandwidth']);

            return $this->client->storageRequest('GET', "pullzone/{$pullZoneId}/analytics/topFiles?{$params}", [
                'operation' => 'get_most_expensive_assets',
                'timeout' => 15,
            ]);
        });
    }

    private function resolvePullZoneId(): ?string
    {
        $hostname = $this->client->settings()->cdn_hostname;

        if (! $hostname) {
            return null;
        }

        $hostname = trim($hostname);

        if (ctype_digit($hostname)) {
            return $hostname;
        }

        $parts = explode('.', $hostname);

        return $parts[0] ?? null;
    }

    private function dateRangeKey(string $prefix, ?string $dateFrom, ?string $dateTo): string
    {
        return "{$prefix}:{$dateFrom}:{$dateTo}";
    }

    /**
     * @param array<string, string> $extra
     */
    private function buildDateParams(?string $dateFrom, ?string $dateTo, array $extra = []): string
    {
        $params = array_merge($extra);

        if ($dateFrom !== null) {
            $params['dateFrom'] = $dateFrom;
        }

        if ($dateTo !== null) {
            $params['dateTo'] = $dateTo;
        }

        return http_build_query($params);
    }
}
