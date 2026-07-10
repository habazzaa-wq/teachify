<?php

namespace App\Services\Usage\Jobs;

use App\Services\Usage\UsageReportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateUsageReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 120;

    public function __construct(
        public readonly int $tenantId,
        public readonly string $period,
    ) {
    }

    public function handle(UsageReportService $reports): void
    {
        Log::channel('usage')->info('GenerateUsageReportJob processing', [
            'tenant_id' => $this->tenantId,
            'period' => $this->period,
        ]);

        $result = match ($this->period) {
            'daily' => $reports->generateDailyReport($this->tenantId),
            'weekly' => $reports->generateWeeklyReport($this->tenantId),
            'monthly' => $reports->generateMonthlyReport($this->tenantId),
            'yearly' => $reports->generateYearlyReport($this->tenantId),
            default => $reports->generateTenantReport($this->tenantId),
        };

        Log::channel('usage')->info('GenerateUsageReportJob completed', [
            'tenant_id' => $this->tenantId,
            'period' => $this->period,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::channel('usage')->error('GenerateUsageReportJob failed', [
            'tenant_id' => $this->tenantId,
            'period' => $this->period,
            'error' => $exception->getMessage(),
        ]);
    }
}