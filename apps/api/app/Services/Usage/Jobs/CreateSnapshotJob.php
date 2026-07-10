<?php

namespace App\Services\Usage\Jobs;

use App\Services\Usage\UsageSnapshotService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CreateSnapshotJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 30;

    public function __construct(
        public readonly int $tenantId,
    ) {
    }

    public function handle(UsageSnapshotService $snapshots): void
    {
        Log::channel('usage')->info('CreateSnapshotJob processing', [
            'tenant_id' => $this->tenantId,
        ]);

        $snapshots->createSnapshot($this->tenantId);

        Log::channel('usage')->info('CreateSnapshotJob completed', [
            'tenant_id' => $this->tenantId,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::channel('usage')->error('CreateSnapshotJob failed', [
            'tenant_id' => $this->tenantId,
            'error' => $exception->getMessage(),
        ]);
    }
}