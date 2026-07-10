<?php

namespace App\Services\UploadGuard;

use Illuminate\Support\ServiceProvider;

class UploadGuardServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(UploadPolicyService::class);
        $this->app->singleton(UploadValidationService::class);
        $this->app->singleton(UploadGuardService::class);
    }
}
