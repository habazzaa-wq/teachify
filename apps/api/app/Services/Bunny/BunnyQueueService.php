<?php

namespace App\Services\Bunny;

use App\Services\Bunny\Jobs\BunnyDeleteJob;
use App\Services\Bunny\Jobs\BunnyRetryJob;
use App\Services\Bunny\Jobs\BunnySyncJob;
use App\Services\Bunny\Jobs\BunnyThumbnailJob;
use App\Services\Bunny\Jobs\BunnyUploadJob;
use App\Services\Bunny\Jobs\BunnyUsageSyncJob;
use App\Services\Bunny\Jobs\BunnyWebhookJob;
use Illuminate\Support\Facades\Log;

class BunnyQueueService
{
    private const QUEUE_BUNNY = 'bunny';
    private const QUEUE_BUNNY_HIGH = 'bunny-high';

    /**
     * @param array<string, mixed> $data
     */
    public function dispatchUpload(array $data, string $priority = 'normal'): void
    {
        $queue = $priority === 'high' ? self::QUEUE_BUNNY_HIGH : self::QUEUE_BUNNY;
        $delay = $data['delay'] ?? 0;

        BunnyUploadJob::dispatch($data)
            ->onQueue($queue)
            ->delay(now()->addSeconds($delay));

        Log::channel('bunny')->info('Bunny upload job dispatched', [
            'queue' => $queue,
            'path' => $data['path'] ?? null,
            'delay' => $delay,
        ]);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function dispatchRetry(array $data): void
    {
        BunnyRetryJob::dispatch($data)
            ->onQueue(self::QUEUE_BUNNY);

        Log::channel('bunny')->info('Bunny retry job dispatched', [
            'path' => $data['path'] ?? null,
            'attempt' => $data['attempt'] ?? 1,
        ]);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function dispatchDelete(array $data): void
    {
        BunnyDeleteJob::dispatch($data)
            ->onQueue(self::QUEUE_BUNNY);

        Log::channel('bunny')->info('Bunny delete job dispatched', [
            'path' => $data['path'] ?? null,
            'video_id' => $data['video_id'] ?? null,
        ]);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function dispatchThumbnail(array $data): void
    {
        BunnyThumbnailJob::dispatch($data)
            ->onQueue(self::QUEUE_BUNNY);

        Log::channel('bunny')->info('Bunny thumbnail job dispatched', [
            'video_id' => $data['video_id'] ?? null,
        ]);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function dispatchSync(array $data): void
    {
        BunnySyncJob::dispatch($data)
            ->onQueue(self::QUEUE_BUNNY);

        Log::channel('bunny')->info('Bunny sync job dispatched', [
            'type' => $data['type'] ?? null,
        ]);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function dispatchUsageSync(array $data = []): void
    {
        BunnyUsageSyncJob::dispatch($data)
            ->onQueue(self::QUEUE_BUNNY);

        Log::channel('bunny')->info('Bunny usage sync job dispatched');
    }

    /**
     * @param array<string, mixed> $data
     */
    public function dispatchWebhook(array $data): void
    {
        BunnyWebhookJob::dispatch($data)
            ->onQueue(self::QUEUE_BUNNY_HIGH);

        Log::channel('bunny')->info('Bunny webhook job dispatched', [
            'event_type' => $data['event_type'] ?? null,
            'video_id' => $data['video_id'] ?? null,
        ]);
    }
}
