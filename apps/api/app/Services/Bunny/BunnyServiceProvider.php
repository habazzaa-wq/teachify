<?php

namespace App\Services\Bunny;

use App\Services\Bunny\Contracts\BunnyAnalyticsInterface;
use App\Services\Bunny\Contracts\BunnyClientInterface;
use App\Services\Bunny\Contracts\BunnyHealthInterface;
use App\Services\Bunny\Contracts\BunnySignedUrlInterface;
use App\Services\Bunny\Contracts\BunnyStreamInterface;
use App\Services\Bunny\Contracts\BunnyStorageInterface;
use App\Services\Bunny\Contracts\BunnyUsageInterface;
use App\Services\Bunny\Contracts\BunnyWebhookInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class BunnyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(BunnyExceptionHandler::class);
        $this->app->singleton(BunnyRetryService::class);
        $this->app->singleton(BunnyCacheService::class);

        $this->app->singleton(BunnyClientInterface::class, BunnyClient::class);
        $this->app->singleton(BunnyStorageInterface::class, BunnyStorageService::class);
        $this->app->singleton(BunnyStreamInterface::class, BunnyStreamService::class);
        $this->app->singleton(BunnyUsageInterface::class, BunnyUsageService::class);
        $this->app->singleton(BunnyAnalyticsInterface::class, BunnyAnalyticsService::class);
        $this->app->singleton(BunnySignedUrlInterface::class, BunnySignedUrlService::class);
        $this->app->singleton(BunnyWebhookInterface::class, BunnyWebhookService::class);
        $this->app->singleton(BunnyHealthInterface::class, BunnyHealthService::class);

        $this->app->singleton(BunnyQueueService::class);
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
        if (method_exists(Log::driver(), 'channel') && ! Log::hasChannel('bunny')) {
            Log::channel('bunny')->info('Bunny integration core initialized');
        }
    }
}
