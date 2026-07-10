<?php

namespace App\Services\Usage;

use App\Repositories\Usage\TenantUsageRepository;
use App\Repositories\Usage\TenantUsageSnapshotRepository;

class UsageSnapshotService
{
    public function __construct(
        private readonly TenantUsageRepository $usageRepo,
        private readonly TenantUsageSnapshotRepository $snapshotRepo,
        private readonly UsageCacheService $cache,
    ) {
    }

    public function createSnapshot(int $tenantId): array
    {
        $usage = $this->usageRepo->getByTenantId($tenantId);

        $snapshot = $this->snapshotRepo->create($tenantId, [
            'storage_bytes' => $usage->storage_bytes ?? 0,
            'bandwidth_bytes' => $usage->bandwidth_bytes ?? 0,
            'views' => $usage->views ?? 0,
            'requests' => $usage->requests ?? 0,
        ]);

        $this->cache->invalidateTenant($tenantId);

        return [
            'id' => $snapshot->id,
            'snapshot_at' => $snapshot->snapshot_at->toIso8601String(),
            'storage_bytes' => $snapshot->storage_bytes,
            'bandwidth_bytes' => $snapshot->bandwidth_bytes,
            'views' => $snapshot->views,
            'requests' => $snapshot->requests,
        ];
    }

    public function getLatestSnapshot(int $tenantId): array
    {
        return $this->cache->cacheSnapshots($tenantId, function () use ($tenantId) {
            $snapshot = $this->snapshotRepo->latestByTenant($tenantId);
            if (!$snapshot) {
                return [
                    'has_snapshot' => false,
                    'snapshot_at' => null,
                    'storage_bytes' => 0,
                    'bandwidth_bytes' => 0,
                    'views' => 0,
                    'requests' => 0,
                ];
            }
            return [
                'has_snapshot' => true,
                'snapshot_at' => $snapshot->snapshot_at->toIso8601String(),
                'storage_bytes' => $snapshot->storage_bytes,
                'bandwidth_bytes' => $snapshot->bandwidth_bytes,
                'views' => $snapshot->views,
                'requests' => $snapshot->requests,
            ];
        });
    }

    public function getSnapshots(int $tenantId): array
    {
        $snapshots = $this->snapshotRepo->snapshotsByTenant($tenantId);
        return $snapshots->map(fn ($s) => [
            'id' => $s->id,
            'snapshot_at' => $s->snapshot_at->toIso8601String(),
            'storage_bytes' => $s->storage_bytes,
            'bandwidth_bytes' => $s->bandwidth_bytes,
            'views' => $s->views,
            'requests' => $s->requests,
        ])->toArray();
    }

    public function deleteOldSnapshots(int $tenantId, string $before): void
    {
        $this->snapshotRepo->deleteOlderThan($tenantId, $before);
        $this->cache->invalidateTenant($tenantId);
    }
}