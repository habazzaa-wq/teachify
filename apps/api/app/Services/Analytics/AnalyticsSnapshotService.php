<?php

namespace App\Services\Analytics;

use App\Models\AnalyticsSnapshot;
use App\Models\Tenant;
use Carbon\CarbonInterface;

class AnalyticsSnapshotService
{
    public function __construct(private readonly AnalyticsQueryService $queries)
    {
    }

    public function daily(Tenant $tenant, ?CarbonInterface $date = null): AnalyticsSnapshot
    {
        return $this->create($tenant, 'overview', 'daily', $date ?? now());
    }

    public function weekly(Tenant $tenant, ?CarbonInterface $date = null): AnalyticsSnapshot
    {
        return $this->create($tenant, 'overview', 'weekly', $date ?? now());
    }

    public function monthly(Tenant $tenant, ?CarbonInterface $date = null): AnalyticsSnapshot
    {
        return $this->create($tenant, 'overview', 'monthly', $date ?? now());
    }

    private function create(Tenant $tenant, string $type, string $period, CarbonInterface $date): AnalyticsSnapshot
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);

        return AnalyticsSnapshot::create([
            'tenant_id' => $tenant->id,
            'type' => $type,
            'period' => $period,
            'snapshot_date' => $date->toDateString(),
            'payload' => $this->queries->tenantOverviewPayload($tenant),
            'generated_at' => now(),
        ])->refresh();
    }
}
