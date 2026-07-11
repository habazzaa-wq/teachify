<?php

namespace App\Console\Commands;

use App\Services\Media\ResumableUploadService;
use Illuminate\Console\Command;

class GarbageCollectUploads extends Command
{
    protected $signature = 'media:gc-uploads
        {--session-grace=1440 : Minutes an inactive session may live before purge}
        {--stuck-chunk=180 : Minutes an unfinished-but-active session may live before purge}';

    protected $description = 'Purge expired, abandoned and stuck resumable upload sessions and their temporary artifacts.';

    public function handle(ResumableUploadService $service): int
    {
        $sessionGrace = (int) $this->option('session-grace');
        $stuckChunk = (int) $this->option('stuck-chunk');

        $this->info('Collecting expired and abandoned upload sessions...');

        $purged = $service->garbageCollect($sessionGrace, $stuckChunk);

        $this->info("Purged {$purged} upload session(s).");

        return self::SUCCESS;
    }
}
