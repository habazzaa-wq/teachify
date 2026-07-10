<?php

namespace App\Services\Usage;

use App\Repositories\Usage\TenantUsageHistoryRepository;

class UsageHistoryService
{
    public function __construct(
        private readonly TenantUsageHistoryRepository $historyRepo,
        private readonly UsageCacheService $cache,
    ) {
    }

    public function dailyHistory(int $tenantId, int $limit = 30): array
    {
        return $this->periodHistory($tenantId, 'daily', $limit);
    }

    public function weeklyHistory(int $tenantId, int $limit = 12): array
    {
        return $this->periodHistory($tenantId, 'weekly', $limit);
    }

    public function monthlyHistory(int $tenantId, int $limit = 12): array
    {
        return $this->periodHistory($tenantId, 'monthly', $limit);
    }

    public function yearlyHistory(int $tenantId, int $limit = 5): array
    {
        return $this->periodHistory($tenantId, 'yearly', $limit);
    }

    public function periodHistory(int $tenantId, string $period, int $limit = 30): array
    {
        return $this->cache->cacheHistory($tenantId, $period, $limit, function () use ($tenantId, $period, $limit) {
            $records = $this->historyRepo->tenantHistoryByPeriod($tenantId, $period);
            return $records->reverse()->take($limit)->reverse()->values()->map(fn ($r) => [
                'date' => $r->date->toDateString(),
                'period' => $r->period,
                'storage_bytes' => $r->storage_bytes,
                'bandwidth_bytes' => $r->bandwidth_bytes,
                'views' => $r->views,
                'requests' => $r->requests,
            ])->toArray();
        });
    }
}