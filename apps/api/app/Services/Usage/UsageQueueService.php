<?php

namespace App\Services\Usage;

use App\Services\Usage\Jobs\SyncTenantUsageJob;
use App\Services\Usage\Jobs\SyncAllTenantsUsageJob;
use App\Services\Usage\Jobs\CreateSnapshotJob;
use App\Services\Usage\Jobs\CalculateUsageJob;
use App\Services\Usage\Jobs\ProcessThresholdsJob;
use App\Services\Usage\Jobs\GenerateUsageReportJob;
use App\Services\Usage\Jobs\RetryUsageSyncJob;
use Illuminate\Support\Facades\Log;

class UsageQueueService
{
    private const QUEUE = 'usage';

    public function dispatchSyncTenant(int $tenantId): void
    {
        SyncTenantUsageJob::dispatch($tenantId)
            ->onQueue(self::QUEUE);

        Log::channel('usage')->info('Usage sync job dispatched', [
            'tenant_id' => $tenantId,
        ]);
    }

    public function dispatchSyncAll(): void
    {
        SyncAllTenantsUsageJob::dispatch()
            ->onQueue(self::QUEUE);

        Log::channel('usage')->info('Sync all usage job dispatched');
    }

    public function dispatchCreateSnapshot(int $tenantId): void
    {
        CreateSnapshotJob::dispatch($tenantId)
            ->onQueue(self::QUEUE);

        Log::channel('usage')->info('Create snapshot job dispatched', [
            'tenant_id' => $tenantId,
        ]);
    }

    public function dispatchCalculateUsage(int $tenantId): void
    {
        $data = ['tenant_id' => $tenantId];
        CalculateUsageJob::dispatch($data)
            ->onQueue(self::QUEUE);

        Log::channel('usage')->info('Calculate usage job dispatched', [
            'tenant_id' => $tenantId,
        ]);
    }

    public function dispatchThresholds(int $tenantId): void
    {
        ProcessThresholdsJob::dispatch($tenantId)
            ->onQueue(self::QUEUE);

        Log::channel('usage')->info('Process thresholds job dispatched', [
            'tenant_id' => $tenantId,
        ]);
    }

    public function dispatchRetry(int $tenantId): void
    {
        $data = ['tenant_id' => $tenantId];
        RetryUsageSyncJob::dispatch($data)
            ->onQueue(self::QUEUE);

        Log::channel('usage')->info('Retry usage sync job dispatched', [
            'tenant_id' => $tenantId,
        ]);
    }

    public function dispatchGenerateReport(int $tenantId, string $period): void
    {
        GenerateUsageReportJob::dispatch($tenantId, $period)
            ->onQueue(self::QUEUE);
    }
}
