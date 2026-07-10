<?php

namespace App\Services\Usage;

use App\Repositories\Usage\TenantUsageRepository;
use App\Repositories\Usage\TenantUsageHistoryRepository;
use App\Repositories\Usage\TenantUsageSnapshotRepository;

class TenantUsageService
{
    public function __construct(
        private readonly TenantUsageRepository $usageRepo,
        private readonly TenantUsageHistoryRepository $historyRepo,
        private readonly TenantUsageSnapshotRepository $snapshotRepo,
        private readonly SubscriptionLimitService $limits,
        private readonly UsageCacheService $cache,
    ) {
    }

    public function getUsage(int $tenantId): array
    {
        $usage = $this->usageRepo->getByTenantId($tenantId);

        return [
            'tenant_id' => $tenantId,
            'storage_bytes' => $usage->storage_bytes ?? 0,
            'bandwidth_bytes' => $usage->bandwidth_bytes ?? 0,
            'stream_bandwidth_bytes' => $usage->stream_bandwidth_bytes ?? 0,
            'cdn_bandwidth_bytes' => $usage->cdn_bandwidth_bytes ?? 0,
            'requests' => $usage->requests ?? 0,
            'views' => $usage->views ?? 0,
            'uploaded_files' => $usage->uploaded_files ?? 0,
            'uploaded_videos' => $usage->uploaded_videos ?? 0,
            'collections' => $usage->collections ?? 0,
            'folders' => $usage->folders ?? 0,
            'last_synced_at' => $usage->last_synced_at,
        ];
    }

    public function getUsageHistory(int $tenantId, string $period = 'daily', int $limit = 30): array
    {
        return $this->cache->cacheHistory($tenantId, $period, $limit, function () use ($tenantId, $period, $limit) {
            $records = $this->historyRepo->recentByTenant($tenantId, $limit);
            $filtered = $records->filter(fn ($r) => $r->period === $period);
            return $filtered->values()->toArray();
        });
    }

    public function getUsageSnapshot(int $tenantId, ?string $since = null): array
    {
        if ($since) {
            $snapshots = $this->snapshotRepo->snapshotsSince($tenantId, $since);
        } else {
            $snapshot = $this->snapshotRepo->latestByTenant($tenantId);
            $snapshots = $snapshot ? [$snapshot] : [];
        }

        return array_map(function ($s) {
            return [
                'id' => $s->id,
                'snapshot_at' => $s->snapshot_at->toIso8601String(),
                'storage_bytes' => $s->storage_bytes,
                'bandwidth_bytes' => $s->bandwidth_bytes,
                'views' => $s->views,
                'requests' => $s->requests,
            ];
        }, $snapshots);
    }

    public function getQuota(int $tenantId): array
    {
        $usage = $this->getUsage($tenantId);
        $limits = $this->limits->getAllLimits($tenantId);

        return [
            'usage' => $usage,
            'limits' => $limits,
            'remaining' => [
                'storage_bytes' => max(0, $limits['storage'] - $usage['storage_bytes']),
                'bandwidth_bytes' => max(0, $limits['bandwidth'] - $usage['bandwidth_bytes']),
                'views' => max(0, $limits['views'] - $usage['views']),
            ],
            'percentages' => [
                'storage' => $limits['storage'] > 0 ? round(($usage['storage_bytes'] / $limits['storage']) * 100, 2) : 0,
                'bandwidth' => $limits['bandwidth'] > 0 ? round(($usage['bandwidth_bytes'] / $limits['bandwidth']) * 100, 2) : 0,
                'views' => $limits['views'] > 0 ? round(($usage['views'] / $limits['views']) * 100, 2) : 0,
            ],
        ];
    }

    public function getRemainingLimits(int $tenantId): array
    {
        $usage = $this->getUsage($tenantId);
        $limits = $this->limits->getAllLimits($tenantId);

        return [
            'remaining_storage_bytes' => max(0, $limits['storage'] - $usage['storage_bytes']),
            'remaining_bandwidth_bytes' => max(0, $limits['bandwidth'] - $usage['bandwidth_bytes']),
            'remaining_views' => max(0, $limits['views'] - $usage['views']),
            "remaining_storage_percentage" => $this->remainingPercentage($limits['storage'], $usage['storage_bytes']),
            'remaining_bandwidth_percentage' => $this->remainingPercentage($limits['bandwidth'], $usage['bandwidth_bytes']),
            'remaining_views_percentage' => $this->remainingPercentage($limits['views'], $usage['views']),
        ];
    }

    public function getSyncStatus(int $tenantId): array
    {
        $usage = $this->usageRepo->getByTenantId($tenantId);

        if (!$usage) {
            return [
                'tenant_id' => $tenantId,
                'last_synced_at' => null,
                'needs_sync' => true,
                'is_empty' => true,
            ];
        }

        return [
            'tenant_id' => $tenantId,
            'last_synced_at' => $usage->last_synced_at,
            'needs_sync' => $usage->last_synced_at === null || $usage->last_synced_at < now()->subMinutes(15),
            'is_empty' => false,
        ];
    }

    public function syncUsage(int $tenantId): void
    {
        $settingsRepo = app(\App\Repositories\PlatformBunnySettingRepository::class);
        $settings = $settingsRepo->getActive();
        if (!$settings || !$settings->enabled) {
            return;
        }

        $bunnyUsage = app(\App\Services\Bunny\Contracts\BunnyUsageInterface::class);
        $usageData = $bunnyUsage->getTenantUsage($tenantId);

        $update = [
            'storage_bytes' => $usageData['platform_storage_bytes'] ?? 0,
            'last_synced_at' => now(),
        ];

        $this->usageRepo->updateOrCreate($tenantId, $update);
        $this->cache->invalidateTenant($tenantId);
    }

    private function remainingPercentage($limit, $used): float
    {
        if ($limit <= 0) {
            return 0;
        }
        $remaining = max(0, $limit - $used);
        return round(($remaining / $limit) * 100, 2);
    }
}
