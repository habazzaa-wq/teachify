<?php

namespace App\Services\Usage\Jobs;

use App\Services\Usage\UsageThresholdService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessThresholdsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 30;

    public function __construct(
        public readonly int $tenantId,
    ) {
    }

    public function handle(UsageThresholdService $thresholds): void
    {
        Log::channel('usage')->info('ProcessThresholdsJob processing', [
            'tenant_id' => $this->tenantId,
        ]);

        $thresholds->checkAllThresholds($this->tenantId);

        Log::channel('usage')->info('ProcessThresholdsJob completed', [
            'tenant_id' => $this->tenantId,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::channel('usage')->error('ProcessThresholdsJob failed', [
            'tenant_id' => $this->tenantId,
            'error' => $exception->getMessage(),
        ]);
    }
}