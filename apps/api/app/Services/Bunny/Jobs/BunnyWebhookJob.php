<?php

namespace App\Services\Bunny\Jobs;

use App\Services\Bunny\BunnyWebhookService;
use App\Services\Bunny\Events\VideoReady;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class BunnyWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 30;

    /** @var array<string, mixed> */
    public array $data;

    /**
     * @param array<string, mixed> $data
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function handle(BunnyWebhookService $webhook): void
    {
        $payload = $this->data['payload'] ?? $this->data;
        $signature = $this->data['signature'] ?? null;

        if ($signature !== null && ! $webhook->validateSignature(is_string($payload) ? $payload : json_encode($payload), $signature)) {
            Log::channel('bunny')->warning('BunnyWebhookJob invalid signature');

            return;
        }

        $normalized = is_array($payload) ? $payload : json_decode((string) $payload, true) ?? [];
        $result = $webhook->processWebhook($normalized, $this->data['event_type'] ?? null);

        Log::channel('bunny')->info('BunnyWebhookJob processed', [
            'event_type' => $result['event_type'],
            'video_id' => $result['video_id'],
            'valid' => $result['valid'],
        ]);

        if ($result['event_type'] === 'video_ready' && $result['video_id'] !== null) {
            VideoReady::dispatch(
                $this->data['tenant_id'] ?? 0,
                (string) $result['video_id'],
                $result['data'],
            );
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::channel('bunny')->error('BunnyWebhookJob failed', [
            'data' => array_keys($this->data),
            'error' => $exception->getMessage(),
        ]);
    }
}
