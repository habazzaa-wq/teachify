<?php

namespace App\Services\Bunny\Jobs;

use App\Models\MediaAsset;
use App\Services\Bunny\BunnyCacheService;
use App\Services\Bunny\BunnyRetryService;
use App\Services\Bunny\BunnyStorageService;
use App\Services\Bunny\BunnyStreamService;
use App\Services\Bunny\Events\MediaDeleted;
use App\Services\Bunny\Events\MediaDeleteFailed;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class BunnyDeleteJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    public int $timeout = 60;

    public int $backoff = 30;

    /** @var array<string, mixed> */
    public array $data;

    /**
     * @param  array<string, mixed>  $data
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(
        BunnyStorageService $storage,
        BunnyStreamService $stream,
        BunnyRetryService $retryService,
        BunnyCacheService $cache,
    ): void {
        $service = $this->data['service'] ?? 'storage';
        $path = $this->data['path'] ?? null;
        $videoId = $this->data['video_id'] ?? null;
        $assetId = $this->data['asset_id'] ?? null;
        $tenantId = $this->data['tenant_id'] ?? 0;

        $start = microtime(true);

        Log::channel('bunny')->info('BunnyDeleteJob processing', [
            'service' => $service,
            'path' => $path,
            'video_id' => $videoId,
            'asset_id' => $assetId,
            'tenant_id' => $tenantId,
            'attempt' => $this->attempts(),
        ]);

        if ($service === 'storage' && $path !== null) {
            $storage->deleteFile($path);
            $cache->invalidateStorage(dirname((string) $path));
        } elseif ($service === 'stream' && $videoId !== null) {
            $stream->deleteVideo($videoId);
            $cache->invalidateVideo((string) $videoId);
        } else {
            Log::channel('bunny')->warning('BunnyDeleteJob: no valid target', [
                'service' => $service,
                'path' => $path,
                'video_id' => $videoId,
            ]);

            return;
        }

        $duration = round((microtime(true) - $start) * 1000, 1);

        Log::channel('bunny')->info('BunnyDeleteJob completed', [
            'service' => $service,
            'path' => $path,
            'video_id' => $videoId,
            'asset_id' => $assetId,
            'duration_ms' => $duration,
            'attempt' => $this->attempts(),
        ]);

        if ($assetId !== null) {
            MediaDeleted::dispatch($tenantId, $path ?? (string) $videoId, $service);
        }
    }

    public function failed(\Throwable $exception): void
    {
        $service = $this->data['service'] ?? 'unknown';
        $path = $this->data['path'] ?? null;
        $videoId = $this->data['video_id'] ?? null;
        $assetId = $this->data['asset_id'] ?? null;
        $tenantId = $this->data['tenant_id'] ?? 0;

        Log::channel('bunny')->error('BunnyDeleteJob failed permanently', [
            'service' => $service,
            'path' => $path,
            'video_id' => $videoId,
            'asset_id' => $assetId,
            'tenant_id' => $tenantId,
            'attempts' => $this->attempts(),
            'error' => $exception->getMessage(),
        ]);

        if ($assetId !== null) {
            $asset = MediaAsset::find($assetId);

            if ($asset) {
                event(new MediaDeleteFailed(
                    $asset,
                    $tenantId,
                    'bunny',
                    $service,
                    $exception->getMessage(),
                    $exception->getCode() ?: null,
                ));
            }
        }
    }
}
