<?php

namespace App\Services\Usage\Jobs;

use App\Services\Usage\UsageSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncAllTenantsUsageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 300;

    public function handle(UsageSyncService $sync): void
    {
        Log::channel('usage')->info('SyncAllTenantsUsageJob processing');

        $sync->syncAllTenants();

        Log::channel('usage')->info('SyncAllTenantsUsageJob completed');
    }

    public function failed(\Throwable $exception): void
    {
        Log::channel('usage')->error('SyncAllTenantsUsageJob failed', [
            'error' => $exception->getMessage(),
        ]);
    }
}