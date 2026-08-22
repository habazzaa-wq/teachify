<?php

use App\Console\Commands\CleanupAbandonedScanUploads;
use App\Console\Commands\GarbageCollectUploads;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Reclaim temporary upload artifacts automatically.
Schedule::command(GarbageCollectUploads::class)->everyFiveMinutes();

// Clean up abandoned scan upload temp files daily.
Schedule::command(CleanupAbandonedScanUploads::class)->daily();
