<?php

namespace App\Services\Usage;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class UsageServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(UsageCacheService::class);
        $this->app->singleton(UsageQueueService::class);

        $this->app->singleton(SubscriptionLimitService::class);
        $this->app->singleton(TenantUsageService::class);
        $this->app->singleton(TenantQuotaService::class);
        $this->app->singleton(UsageAggregatorService::class);
        $this->app->singleton(UsageSyncService::class);
        $this->app->singleton(UsageCalculatorService::class);
        $this->app->singleton(UsageSnapshotService::class);
        $this->app->singleton(UsageThresholdService::class);
        $this->app->singleton(UsageHistoryService::class);
        $this->app->singleton(UsageReportService::class);
    }

    public function boot(): void
    {
        if (! $this->app->runningInConsole()) {
            return;
        }

        $this->configureLogging();
    }

    private function configureLogging(): void
    {
        if (method_exists(Log::driver(), 'channel') && ! Log::hasChannel('usage')) {
            Log::channel('usage')->info('Usage engine initialized');
        }
    }
}