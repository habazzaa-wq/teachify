<?php

namespace App\Services\Bunny\Jobs;

use App\Services\Bunny\BunnyStreamService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class BunnyThumbnailJob implements ShouldQueue
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
    public function handle(BunnyStreamService $stream): void
    {
        $videoId = $this->data['video_id'] ?? null;

        if ($videoId === null) {
            Log::channel('bunny')->error('BunnyThumbnailJob missing video_id');

            return;
        }

        Log::channel('bunny')->info('BunnyThumbnailJob processing', [
            'video_id' => $videoId,
        ]);

        $result = $stream->generateThumbnail($videoId, [
            'time' => $this->data['time'] ?? null,
        ]);

        Log::channel('bunny')->info('BunnyThumbnailJob completed', [
            'video_id' => $videoId,
            'result' => $result,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::channel('bunny')->error('BunnyThumbnailJob failed', [
            'video_id' => $this->data['video_id'] ?? null,
            'error' => $exception->getMessage(),
        ]);
    }
}
