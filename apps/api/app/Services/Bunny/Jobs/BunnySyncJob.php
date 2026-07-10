<?php

namespace App\Services\Bunny\Jobs;

use App\Services\Bunny\BunnyStorageService;
use App\Services\Bunny\BunnyStreamService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class BunnySyncJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    /** @var array<string, mixed> */
    public array $data;

    /**
     * @param array<string, mixed> $data
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * @param array<string, mixed> $data
     */
    public function handle(
        BunnyStorageService $storage,
        BunnyStreamService $stream,
    ): void {
        $type = $this->data['type'] ?? 'storage';
        $path = $this->data['path'] ?? null;
        $videoId = $this->data['video_id'] ?? null;

        Log::channel('bunny')->info('BunnySyncJob processing', [
            'type' => $type,
            'path' => $path,
            'video_id' => $videoId,
        ]);

        if ($type === 'storage' && $path !== null) {
            $metadata = $storage->getMetadata($path);

            Log::channel('bunny')->info('BunnySyncJob storage metadata synced', [
                'path' => $path,
                'metadata_keys' => array_keys($metadata),
            ]);
        } elseif ($type === 'stream' && $videoId !== null) {
            $status = $stream->getVideoStatus($videoId);

            Log::channel('bunny')->info('BunnySyncJob stream status synced', [
                'video_id' => $videoId,
                'status' => $status['status'] ?? null,
            ]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::channel('bunny')->error('BunnySyncJob failed', [
            'data' => array_keys($this->data),
            'error' => $exception->getMessage(),
        ]);
    }
}
