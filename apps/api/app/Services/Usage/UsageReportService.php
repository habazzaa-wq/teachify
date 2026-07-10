<?php

namespace App\Services\Usage;

use App\Repositories\Usage\TenantUsageRepository;
use App\Repositories\Usage\TenantUsageHistoryRepository;
use App\Repositories\Usage\TenantUsageSnapshotRepository;

class UsageReportService
{
    public function __construct(
        private readonly TenantUsageRepository $usageRepo,
        private readonly TenantUsageHistoryRepository $historyRepo,
        private readonly TenantUsageSnapshotRepository $snapshotRepo,
        private readonly SubscriptionLimitService $limits,
        private readonly UsageAggregatorService $aggregator,
    ) {
    }

    public function generateDailyReport(int $tenantId): array
    {
        $today = now()->toDateString();
        $usage = $this->aggregator->currentUsage($tenantId);
        $limits = $this->limits->getAllLimits($tenantId);

        return [
            'tenant_id' => $tenantId,
            'report_type' => 'daily',
            'report_date' => $today,
            'current_usage' => $usage,
            'limits' => $limits,
            'remaining' => [
                'storage_bytes' => max(0, $limits['storage'] - $usage['storage_bytes']),
                'bandwidth_bytes' => max(0, $limits['bandwidth'] - $usage['bandwidth_bytes']),
                'views' => max(0, $limits['views'] - $usage['views']),
            ],
        ];
    }

    public function generateWeeklyReport(int $tenantId): array
    {
        $startOfWeek = now()->startOfWeek()->toDateString();
        $usage = $this->aggregator->currentUsage($tenantId);
        $limits = $this->limits->getAllLimits($tenantId);
        $history = $this->historyRepo->recentByTenant($tenantId, 7);

        return [
            'tenant_id' => $tenantId,
            'report_type' => 'weekly',
            'week_start' => $startOfWeek,
            'current_usage' => $usage,
            'limits' => $limits,
            'history' => $history->map(fn ($r) => [
                'date' => $r->date->toDateString(),
                'storage_bytes' => $r->storage_bytes,
                'bandwidth_bytes' => $r->bandwidth_bytes,
            ]),
        ];
    }

    public function generateMonthlyReport(int $tenantId): array
    {
        $startOfMonth = now()->startOfMonth()->toDateString();
        $usage = $this->aggregator->currentUsage($tenantId);
        $limits = $this->limits->getAllLimits($tenantId);
        $history = $this->historyRepo->recentByTenant($tenantId, 30);
        $snapshots = $this->snapshotRepo->snapshotsSince($tenantId, $startOfMonth);

        return [
            'tenant_id' => $tenantId,
            'report_type' => 'monthly',
            'month_start' => $startOfMonth,
            'current_usage' => $usage,
            'limits' => $limits,
            'history' => $history->map(fn ($r) => [
                'date' => $r->date->toDateString(),
                'storage_bytes' => $r->storage_bytes,
                'bandwidth_bytes' => $r->bandwidth_bytes,
                'views' => $r->views,
            ]),
            'snapshots' => $snapshots->map(fn ($s) => [
                'snapshot_at' => $s->snapshot_at->toIso8601String(),
                'storage_bytes' => $s->storage_bytes,
                'bandwidth_bytes' => $s->bandwidth_bytes,
                'views' => $s->views,
            ]),
        ];
    }

    public function generateYearlyReport(int $tenantId): array
    {
        $startOfYear = now()->startOfYear()->toDateString();
        $usage = $this->aggregator->currentUsage($tenantId);
        $limits = $this->limits->getAllLimits($tenantId);
        $history = $this->historyRepo->tenantHistoryByPeriod($tenantId, 'monthly');

        return [
            'tenant_id' => $tenantId,
            'report_type' => 'yearly',
            'year_start' => $startOfYear,
            'current_usage' => $usage,
            'limits' => $limits,
            'monthly_history' => $history->map(fn ($r) => [
                'date' => $r->date->toDateString(),
                'storage_bytes' => $r->storage_bytes,
                'bandwidth_bytes' => $r->bandwidth_bytes,
                'views' => $r->views,
            ]),
        ];
    }

    public function generatePlatformReport(): array
    {
        $allUsage = $this->usageRepo->allWithUsage();

        $totals = [
            'tenants_count' => $allUsage->count(),
            'total_storage_bytes' => $allUsage->sum('storage_bytes'),
            'total_bandwidth_bytes' => $allUsage->sum('bandwidth_bytes'),
            'total_views' => $allUsage->sum('views'),
            'total_requests' => $allUsage->sum('requests'),
        ];

        return [
            'report_type' => 'platform',
            'generated_at' => now()->toIso8601String(),
            'totals' => $totals,
            'tenant_count' => $allUsage->count(),
        ];
    }
}
