<?php

namespace App\Services\Bunny\Jobs;

use App\Services\Bunny\BunnyStorageService;
use App\Services\Bunny\BunnyStreamService;
use App\Services\Bunny\Events\MediaUploaded;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class BunnyUploadJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public int $backoff = 60;

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
        $contents = $this->data['contents'] ?? null;
        $videoId = $this->data['video_id'] ?? null;

        Log::channel('bunny')->info('BunnyUploadJob processing', [
            'service' => $service,
            'path' => $path,
            'video_id' => $videoId,
        ]);

        if ($service === 'storage') {
            if ($path === null || $contents === null) {
                Log::channel('bunny')->error('BunnyUploadJob missing required data', ['data' => array_keys($this->data)]);

                return;
            }

            $result = $storage->uploadFile($path, $contents, [
                'mime_type' => $this->data['mime_type'] ?? 'application/octet-stream',
                'checksum' => $this->data['checksum'] ?? null,
                'overwrite' => $this->data['overwrite'] ?? true,
            ]);

            MediaUploaded::dispatch($this->data['tenant_id'] ?? 0, $path, 'storage', $result);
        } elseif ($service === 'stream') {
            $title = $this->data['title'] ?? 'Untitled Video';
            $result = $stream->createVideo($title, [
                'video_id' => $videoId,
                'collection_id' => $this->data['collection_id'] ?? null,
            ]);

            MediaUploaded::dispatch($this->data['tenant_id'] ?? 0, $videoId ?? '', 'stream', $result);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::channel('bunny')->error('BunnyUploadJob failed', [
            'data' => array_keys($this->data),
            'error' => $exception->getMessage(),
        ]);
    }
}
