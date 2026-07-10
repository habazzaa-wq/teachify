<?php

namespace App\Services\Usage\Jobs;

use App\Services\Usage\UsageSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RetryUsageSyncJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;
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

    public function handle(UsageSyncService $sync): void
    {
        $tenantId = $this->data['tenant_id'];

        Log::channel('usage')->info('RetryUsageSyncJob processing', [
            'tenant_id' => $tenantId,
            'attempt' => $this->attempts(),
        ]);

        $sync->syncTenant($tenantId);

        Log::channel('usage')->info('RetryUsageSyncJob completed', [
            'tenant_id' => $tenantId,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::channel('usage')->error('RetryUsageSyncJob failed', [
            'tenant_id' => $this->data['tenant_id'] ?? null,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
        ]);
    }
}