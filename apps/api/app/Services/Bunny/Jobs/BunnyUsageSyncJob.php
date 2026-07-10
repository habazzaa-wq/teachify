<?php

namespace App\Services\Bunny\Jobs;

use App\Services\Bunny\BunnyUsageService;
use App\Services\Bunny\Events\UsageUpdated;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class BunnyUsageSyncJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public int $timeout = 30;

    /** @var array<string, mixed> */
    public array $data;

    /**
     * @param array<string, mixed> $data
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function handle(BunnyUsageService $usage): void
    {
        Log::channel('bunny')->info('BunnyUsageSyncJob processing');

        $platformUsage = $usage->getPlatformUsage();

        UsageUpdated::dispatch($platformUsage);

        Log::channel('bunny')->info('BunnyUsageSyncJob completed', [
            'storage_bytes' => $platformUsage['storage']['storage_used_bytes'] ?? 0,
            'bandwidth_bytes' => $platformUsage['bandwidth']['bandwidth_used_bytes'] ?? 0,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::channel('bunny')->error('BunnyUsageSyncJob failed', [
            'error' => $exception->getMessage(),
        ]);
    }
}
