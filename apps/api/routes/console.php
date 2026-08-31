<?php

use App\Console\Commands\CleanupAbandonedScanUploads;
use App\Console\Commands\GarbageCollectUploads;
use App\Console\Commands\SyncStreamVideoStatusCommand;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Reclaim temporary upload artifacts automatically. Prevent concurrent runs
// (a slow run must never queue up and hammer the DB alongside other writes).
Schedule::command(GarbageCollectUploads::class)
    ->everyFiveMinutes()
    ->withoutOverlapping();

// Clean up abandoned scan upload temp files daily.
Schedule::command(CleanupAbandonedScanUploads::class)
    ->daily()
    ->withoutOverlapping();

// Keep Bunny Stream videos in sync with their real encoding status so a
// missed/undelivered webhook never leaves an asset stuck on "processing".
// Polling every 5 minutes is unnecessary when nothing is stuck and only spikes
// DB + Bunny traffic during active uploads; run it at a :02-offset so the two
// 5-minute jobs never fire in the same minute (the upload GC runs at :00/:05).
Schedule::command(SyncStreamVideoStatusCommand::class)
    ->cron('2,7,12,17,22,27,32,37,42,47,52,57 * * * *')
    ->withoutOverlapping();
