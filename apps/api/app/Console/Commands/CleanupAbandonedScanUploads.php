<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class CleanupAbandonedScanUploads extends Command
{
    protected $signature = 'scan:cleanup-temp
        {--older-than=60 : Minutes after which a temp file is considered abandoned}';

    protected $description = 'Clean up abandoned temporary scan upload files from storage/scan-temp directory.';

    public function handle(): int
    {
        $olderThanMinutes = (int) $this->option('older-than');
        $cutoff = now()->subMinutes($olderThanMinutes);
        $count = 0;

        $directory = Storage::disk('local')->path('scan-temp');

        if (! is_dir($directory)) {
            $this->info('No scan-temp directory found. Nothing to clean.');

            return self::SUCCESS;
        }

        $files = File::files($directory);

        foreach ($files as $file) {
            if ($file->getMTime() < $cutoff->getTimestamp()) {
                @unlink($file->getRealPath());
                $count++;
            }
        }

        $this->info("Cleaned up {$count} abandoned scan upload file(s).");

        return self::SUCCESS;
    }
}
