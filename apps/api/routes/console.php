<?php

use App\Console\Commands\GarbageCollectUploads;
use App\Jobs\Domain\CheckPendingDomainsJob;
use App\Jobs\Domain\CheckSslExpirationJob;
use App\Jobs\Domain\HealthCheckDomainsJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command(GarbageCollectUploads::class)->everyFiveMinutes();

Schedule::job(CheckPendingDomainsJob::class)->everyTwoMinutes();
Schedule::job(CheckSslExpirationJob::class)->dailyAt('03:00');
Schedule::job(HealthCheckDomainsJob::class)->everySixHours();
