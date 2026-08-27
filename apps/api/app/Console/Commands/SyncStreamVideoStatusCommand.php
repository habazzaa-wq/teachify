<?php

namespace App\Console\Commands;

use App\Models\MediaAsset;
use App\Services\Bunny\BunnyCacheService;
use App\Services\Bunny\BunnyStreamService;
use App\Services\Media\BunnyStreamService as MediaBunnyStreamService;
use Illuminate\Console\Command;
use Throwable;

/**
 * Synchronize Bunny Stream video assets that are stuck in `uploading` /
 * `processing` with Bunny's actual encoding status.
 *
 * Bunny only notifies the app of completion via a library webhook; if that
 * webhook is unconfigured or a delivery is missed, the asset would show an
 * infinite "processing" loader forever. This command is the safety net: it
 * polls Bunny for the real status and updates the asset accordingly. It also
 * heals assets whose Bunny video no longer exists (abandoned uploads).
 */
class SyncStreamVideoStatusCommand extends Command
{
    protected $signature = 'media:sync-stream-status {--dry-run : Preview without updating} {--hours=24 : Only consider assets updated within this many hours}';
    protected $description = 'Sync stuck Bunny Stream video assets with their real Bunny encoding status.';

    public function handle(BunnyStreamService $bunny, MediaBunnyStreamService $media): int
    {
        $hours = (int) $this->option('hours');
        $since = now()->subHours(max(1, $hours));

        $query = MediaAsset::withoutGlobalScopes()
            ->where('provider', 'bunny')
            ->where('provider_service', 'stream')
            ->where('type', 'video')
            ->whereIn('processing_status', ['uploading', 'processing'])
            ->where('updated_at', '>=', $since);

        $total = $query->count();
        if ($total === 0) {
            $this->info('No stuck stream assets to sync.');

            return 0;
        }

        if ($this->option('dry-run')) {
            $this->info("Would sync {$total} stuck stream assets.");

            return 0;
        }

        $synced = 0;
        $failed = 0;
        $skipped = 0;

        $query->chunkById(50, function ($assets) use ($bunny, $media, &$synced, &$failed, &$skipped): void {
            foreach ($assets as $asset) {
                if (empty($asset->external_id)) {
                    // No Bunny video was ever created — treat as a failed upload
                    // so the UI stops showing an infinite loader.
                    if ($asset->created_at->lt(now()->subHours(1))) {
                        $asset->forceFill([
                            'status' => 'failed',
                            'processing_status' => 'failed',
                        ])->save();
                        $failed++;
                        $this->warn("No external_id, marked failed: asset {$asset->id}");
                    } else {
                        $skipped++;
                    }
                    continue;
                }

                try {
                    // Bust the 10-minute Bunny status cache so we read the
                    // live encoding state rather than a stale "processing".
                    app(BunnyCacheService::class)->invalidateVideo($asset->external_id);
                    $status = $bunny->getVideoStatus($asset->external_id);
                } catch (Throwable $e) {
                    // Bunny video no longer exists — abandoned/failed upload.
                    if ($asset->created_at->lt(now()->subHours(1))) {
                        $asset->forceFill([
                            'status' => 'failed',
                            'processing_status' => 'failed',
                        ])->save();
                        $failed++;
                        $this->warn("Bunny video missing, marked failed: asset {$asset->id} ({$e->getMessage()})");
                    } else {
                        $skipped++;
                    }
                    continue;
                }

                try {
                    $media->syncAssetMetadata($asset, [
                        'encoding_status' => $status['encoding_status'] ?? null,
                        'duration_seconds' => $status['duration'] ?? null,
                        'thumbnail_url' => $status['thumbnail_url'] ?? null,
                        'available_resolutions' => $status['resolutions'] ?? [],
                    ]);
                    $synced++;
                    $this->info("Synced asset {$asset->id} -> {$asset->processing_status}");
                } catch (Throwable $e) {
                    $this->error("Failed to sync asset {$asset->id}: {$e->getMessage()}");
                    $skipped++;
                }
            }
        });

        $this->info("Done. synced={$synced} failed={$failed} skipped={$skipped}");

        return 0;
    }
}
