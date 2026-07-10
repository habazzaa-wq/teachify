<?php

namespace App\Repositories\Usage;

use App\Models\Usage\TenantUsageHistory;
use Illuminate\Database\Eloquent\Collection;

class TenantUsageHistoryRepository
{
    public function recentByTenant(int $tenantId, int $limit = 30): Collection
    {
        return TenantUsageHistory::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('date', 'desc')
            ->limit($limit)
            ->get();
    }

    public function getByPeriod(int $tenantId, string $period, string $date): ?TenantUsageHistory
    {
        return TenantUsageHistory::query()
            ->where('tenant_id', $tenantId)
            ->where('period', $period)
            ->where('date', $date)
            ->first();
    }

    public function getOrNew(int $tenantId, string $period, string $date): TenantUsageHistory
    {
        $record = $this->getByPeriod($tenantId, $period, $date);

        if ($record) {
            return $record;
        }

        return new TenantUsageHistory([
            'tenant_id' => $tenantId,
            'period' => $period,
            'date' => $date,
        ]);
    }

    public function save(TenantUsageHistory $history): TenantUsageHistory
    {
        $history->timestamps = true;
        $history->save();
        return $history->fresh();
    }

    public function tenantHistoryByPeriod(int $tenantId, string $period): Collection
    {
        return TenantUsageHistory::query()
            ->where('tenant_id', $tenantId)
            ->where('period', $period)
            ->orderBy('date', 'asc')
            ->get();
    }

    public function deleteBefore(int $tenantId, string $period, string $beforeDate): void
    {
        TenantUsageHistory::query()
            ->where('tenant_id', $tenantId)
            ->where('period', $period)
            ->where('date', '<', $beforeDate)
            ->delete();
    }
}
