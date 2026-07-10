<?php

namespace App\Services\Usage\Jobs;

use App\Services\Usage\UsageCalculatorService;
use App\Services\Usage\UsageCacheService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CalculateUsageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;

    /** @var array<string, mixed> */
    public array $data;

    /**
     * @param array<string, mixed> $data
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function handle(UsageCalculatorService $calculator, UsageCacheService $cache): void
    {
        $tenantId = $this->data['tenant_id'];

        Log::channel('usage')->info('CalculateUsageJob processing', [
            'tenant_id' => $tenantId,
        ]);

        $calculator->calculateAll($tenantId);
        $cache->invalidateTenant($tenantId);

        Log::channel('usage')->info('CalculateUsageJob completed', [
            'tenant_id' => $tenantId,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::channel('usage')->error('CalculateUsageJob failed', [
            'tenant_id' => $this->data['tenant_id'] ?? null,
            'error' => $exception->getMessage(),
        ]);
    }
}