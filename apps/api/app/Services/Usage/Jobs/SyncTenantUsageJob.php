<?php

namespace App\Services\Usage\Jobs;

use App\Services\Usage\UsageSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncTenantUsageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;

    public function __construct(
        public readonly int $tenantId,
    ) {
    }

    public function handle(UsageSyncService $sync): void
    {
        Log::channel('usage')->info('SyncTenantUsageJob processing', [
            'tenant_id' => $this->tenantId,
        ]);

        $sync->syncTenant($this->tenantId);

        Log::channel('usage')->info('SyncTenantUsageJob completed', [
            'tenant_id' => $this->tenantId,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::channel('usage')->error('SyncTenantUsageJob failed', [
            'tenant_id' => $this->tenantId,
            'error' => $exception->getMessage(),
        ]);
    }
}