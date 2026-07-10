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

class BunnyRetryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    public int $timeout = 180;

    public int $backoff = 120;

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
        $operation = $this->data['operation'] ?? 'upload';
        $attempt = $this->data['attempt'] ?? 1;

        Log::channel('bunny')->info('BunnyRetryJob processing', [
            'service' => $service,
            'operation' => $operation,
            'path' => $path,
            'attempt' => $attempt,
        ]);

        if ($service === 'storage') {
            $storage->retryFailedUpload((string) $path, $this->data);
        } elseif ($service === 'stream') {
            $videoId = $this->data['video_id'] ?? null;

            if ($videoId !== null && $operation === 'thumbnail') {
                $stream->generateThumbnail($videoId);
            }
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::channel('bunny')->error('BunnyRetryJob failed', [
            'data' => array_keys($this->data),
            'error' => $exception->getMessage(),
        ]);
    }
}
