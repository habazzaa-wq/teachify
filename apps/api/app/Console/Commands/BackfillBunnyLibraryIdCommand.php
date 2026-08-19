<?php

namespace App\Console\Commands;

use App\Models\MediaAsset;
use App\Services\Media\MediaManager;
use Illuminate\Console\Command;

class BackfillBunnyLibraryIdCommand extends Command
{
    protected $signature = 'media:backfill-bunny-library-id {--dry-run : Show what would be updated without writing}';

    protected $description = 'Populate bunny_library_id on existing Bunny Stream assets that are missing it';

    public function handle(MediaManager $manager): int
    {
        $assets = MediaAsset::withoutGlobalScopes()
            ->where('provider', 'bunny')
            ->where('provider_service', 'stream')
            ->where('type', 'video')
            ->whereNull('bunny_library_id')
            ->get();

        if ($assets->isEmpty()) {
            $this->info('All Bunny Stream assets already have bunny_library_id set.');

            return self::SUCCESS;
        }

        $this->info("Found {$assets->count()} asset(s) missing bunny_library_id.");

        $updated = 0;
        $failed = 0;

        foreach ($assets as $asset) {
            try {
                $playback = $manager->providerFor('bunny', 'stream')->getPlaybackData($asset);

                if (empty($playback['library_id'])) {
                    $this->warn("  Asset {$asset->id}: provider returned no library_id — skipping.");
                    $failed++;

                    continue;
                }

                if ($this->option('dry-run')) {
                    $this->line("  Asset {$asset->id}: would set bunny_library_id = {$playback['library_id']}");
                } else {
                    $asset->forceFill(['bunny_library_id' => $playback['library_id']])->save();
                    $this->line("  Asset {$asset->id}: bunny_library_id = {$playback['library_id']}");
                }

                $updated++;
            } catch (\Throwable $e) {
                $this->error("  Asset {$asset->id}: {$e->getMessage()}");
                $failed++;
            }
        }

        $action = $this->option('dry-run') ? 'would update' : 'updated';
        $this->info("Done. {$action} {$updated} asset(s), {$failed} failed.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
