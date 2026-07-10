<?php

namespace App\Services\Bunny\Jobs;

use App\Services\Bunny\BunnyStorageService;
use App\Services\Bunny\BunnyStreamService;
use App\Services\Bunny\Events\MediaDeleted;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class BunnyDeleteJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 60;

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
        $service = $this->data['service'] ?? 'storage';
        $path = $this->data['path'] ?? null;
        $videoId = $this->data['video_id'] ?? null;

        Log::channel('bunny')->info('BunnyDeleteJob processing', [
            'service' => $service,
            'path' => $path,
            'video_id' => $videoId,
        ]);

        if ($service === 'storage' && $path !== null) {
            $storage->deleteFile($path);

            MediaDeleted::dispatch($this->data['tenant_id'] ?? 0, $path, 'storage');
        } elseif ($service === 'stream' && $videoId !== null) {
            $stream->deleteVideo($videoId);

            MediaDeleted::dispatch($this->data['tenant_id'] ?? 0, $videoId, 'stream');
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::channel('bunny')->error('BunnyDeleteJob failed', [
            'data' => array_keys($this->data),
            'error' => $exception->getMessage(),
        ]);
    }
}
