<?php

namespace App\Services\Usage;

use App\Repositories\Usage\TenantUsageRepository;
use App\Repositories\Usage\TenantUsageHistoryRepository;

class UsageAggregatorService
{
    public function __construct(
        private readonly TenantUsageRepository $usageRepo,
        private readonly TenantUsageHistoryRepository $historyRepo,
        private readonly UsageCacheService $cache,
    ) {
    }

    public function currentUsage(int $tenantId): array
    {
        return $this->cache->cacheCurrentUsage($tenantId, function () use ($tenantId) {
            $usage = $this->usageRepo->getByTenantId($tenantId);
            if (!$usage) {
                return [
                    'tenant_id' => $tenantId,
                    'storage_bytes' => 0,
                    'bandwidth_bytes' => 0,
                    'stream_bandwidth_bytes' => 0,
                    'cdn_bandwidth_bytes' => 0,
                    'requests' => 0,
                    'views' => 0,
                    'uploaded_files' => 0,
                    'uploaded_videos' => 0,
                    'collections' => 0,
                    'folders' => 0,
                    'last_synced_at' => null,
                ];
            }
            return $usage->toArray();
        });
    }

    public function dailyUsage(int $tenantId, string $date): array
    {
        return $this->aggregateByPeriod($tenantId, 'daily', $date);
    }

    public function weeklyUsage(int $tenantId, string $date): array
    {
        return $this->aggregateByPeriod($tenantId, 'weekly', $date);
    }

    public function monthlyUsage(int $tenantId, int $year, int $month): array
    {
        $date = sprintf('%d-%02d-01', $year, $month);
        return $this->aggregateByPeriod($tenantId, 'monthly', $date);
    }

    public function yearlyUsage(int $tenantId, int $year): array
    {
        return $this->aggregateByPeriod($tenantId, 'yearly', (string) $year);
    }

    public function lifetimeUsage(int $tenantId): array
    {
        $usage = $this->usageRepo->getByTenantId($tenantId);
        if (!$usage) {
            return $this->emptyUsage($tenantId);
        }
        return [
            'tenant_id' => $tenantId,
            'storage_bytes' => $usage->storage_bytes,
            'bandwidth_bytes' => $usage->bandwidth_bytes,
            'views' => $usage->views,
            'requests' => $usage->requests,
        ];
    }

    private function aggregateByPeriod(int $tenantId, string $period, string $date): array
    {
        $record = $this->historyRepo->getByPeriod($tenantId, $period, $date);
        if (!$record) {
            $usage = $this->usageRepo->getByTenantId($tenantId);
            return [
                'tenant_id' => $tenantId,
                'period' => $period,
                'date' => $date,
                'storage_bytes' => $usage->storage_bytes ?? 0,
                'bandwidth_bytes' => $usage->bandwidth_bytes ?? 0,
                'views' => $usage->views ?? 0,
                'requests' => $usage->requests ?? 0,
                'stream_bandwidth' => $usage->stream_bandwidth_bytes ?? 0,
                'cdn_bandwidth' => $usage->cdn_bandwidth_bytes ?? 0,
            ];
        }
        return $record->toArray();
    }

    private function emptyUsage(int $tenantId): array
    {
        return [
            'tenant_id' => $tenantId,
            'storage_bytes' => 0,
            'bandwidth_bytes' => 0,
            'views' => 0,
            'requests' => 0,
        ];
    }
}