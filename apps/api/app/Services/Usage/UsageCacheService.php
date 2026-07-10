<?php

namespace App\Services\Usage;

use Illuminate\Support\Facades\Cache;

class UsageCacheService
{
    private const PREFIX = 'usage:';
    private const TTL_USAGE = 120;
    private const TTL_QUOTA = 60;
    private const TTL_HISTORY = 300;
    private const TTL_SNAPSHOT = 600;

    public function cacheCurrentUsage(int $tenantId, callable $callback): mixed
    {
        return $this->remember("current:{$tenantId}", self::TTL_USAGE, $callback);
    }

    public function cacheQuota(int $tenantId, callable $callback): mixed
    {
        return $this->remember("quota:{$tenantId}", self::TTL_QUOTA, $callback);
    }

    public function cacheSnapshots(int $tenantId, callable $callback): mixed
    {
        return $this->remember("snapshots:{$tenantId}", self::TTL_SNAPSHOT, $callback);
    }

    public function cacheHistory(int $tenantId, string $period, int $limit, callable $callback): mixed
    {
        return $this->remember("history:{$tenantId}:{$period}:{$limit}", self::TTL_HISTORY, $callback);
    }

    public function get(string $key): mixed
    {
        return Cache::get(self::PREFIX . $key);
    }

    public function put(string $key, mixed $value): bool
    {
        return Cache::put(self::PREFIX . $key, $value, self::TTL_USAGE);
    }

    public function invalidateCurrent(int $tenantId): void
    {
        Cache::forget(self::PREFIX . "current:{$tenantId}");
        Cache::forget(self::PREFIX . "quota:{$tenantId}");
    }

    public function invalidateSnapshots(int $tenantId): void
    {
        Cache::forget(self::PREFIX . "snapshots:{$tenantId}");
    }

    public function invalidateHistory(int $tenantId): void
    {
        Cache::forget(self::PREFIX . "history:{$tenantId}:daily:30");
        Cache::forget(self::PREFIX . "history:{$tenantId}:weekly:12");
        Cache::forget(self::PREFIX . "history:{$tenantId}:monthly:12");
        Cache::forget(self::PREFIX . "history:{$tenantId}:yearly:5");
    }

    public function invalidateTenant(int $tenantId): void
    {
        $this->invalidateCurrent($tenantId);
        $this->invalidateSnapshots($tenantId);
        $this->invalidateHistory($tenantId);
    }

    private function remember(string $key, int $ttl, callable $callback): mixed
    {
        $cacheKey = self::PREFIX . $key;
        return Cache::remember($cacheKey, $ttl, $callback);
    }
}
