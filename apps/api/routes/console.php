<?php

use App\Console\Commands\CleanupAbandonedQuestionImports;
use App\Console\Commands\CleanupAbandonedScanUploads;
use App\Console\Commands\GarbageCollectUploads;
use App\Console\Commands\SyncStreamVideoStatusCommand;
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

// Reap abandoned question imports past retention daily.
Schedule::command(CleanupAbandonedQuestionImports::class)->dailyAt('03:20');

// Keep Bunny Stream videos in sync with their real encoding status so a
// missed/undelivered webhook never leaves an asset stuck on "processing".
Schedule::command(SyncStreamVideoStatusCommand::class)->everyFiveMinutes();
