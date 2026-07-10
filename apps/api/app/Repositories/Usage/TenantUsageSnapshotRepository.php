<?php

namespace App\Repositories\Usage;

use App\Models\Usage\TenantUsageSnapshot;
use Illuminate\Database\Eloquent\Collection;

class TenantUsageSnapshotRepository
{
    public function latestByTenant(int $tenantId): ?TenantUsageSnapshot
    {
        return TenantUsageSnapshot::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('snapshot_at', 'desc')
            ->first();
    }

    public function snapshotsByTenant(int $tenantId, int $limit = 100): Collection
    {
        return TenantUsageSnapshot::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('snapshot_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function snapshotsSince(int $tenantId, string $since): Collection
    {
        return TenantUsageSnapshot::query()
            ->where('tenant_id', $tenantId)
            ->where('snapshot_at', '>=', $since)
            ->orderBy('snapshot_at', 'asc')
            ->get();
    }

    public function save(TenantUsageSnapshot $snapshot): TenantUsageSnapshot
    {
        $snapshot->timestamps = true;
        $snapshot->save();
        return $snapshot->fresh();
    }

    public function deleteOlderThan(int $tenantId, string $beforeDate): void
    {
        TenantUsageSnapshot::query()
            ->where('tenant_id', $tenantId)
            ->where('snapshot_at', '<', $beforeDate)
            ->delete();
    }

    public function create(int $tenantId, array $data): TenantUsageSnapshot
    {
        $snapshot = new TenantUsageSnapshot(array_merge([
            'tenant_id' => $tenantId,
            'snapshot_at' => now(),
        ], $data));

        return $this->save($snapshot);
    }
}
