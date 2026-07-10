<?php

namespace App\Services\Bunny;

use App\Services\Bunny\Contracts\BunnyWebhookInterface;
use Illuminate\Support\Facades\Log;

class BunnyWebhookService implements BunnyWebhookInterface
{
    private const KNOWN_EVENTS = [
        'video_ready',
        'video_encoding_finished',
        'upload_completed',
        'video_deleted',
        'storage_updated',
        'collection_updated',
    ];

    public function __construct(
        private readonly BunnyCacheService $cache,
    ) {
    }

    public function validateSignature(string $payload, string $signature): bool
    {
        $secret = $this->getWebhookSecret();

        if ($secret === null) {
            Log::channel('bunny')->warning('Bunny webhook signature validation skipped: no secret configured.');

            return false;
        }

        $expected = hash_hmac('sha256', $payload, $secret);

        return hash_equals($expected, $signature);
    }

    /**
     * @param array<string, mixed> $payload
     * @return array{event_type: string, data: array<string, mixed>, video_id: string|null, valid: bool}
     */
    public function processWebhook(array $payload, ?string $eventType = null): array
    {
        $resolvedType = $eventType
            ?? $this->extractEventType($payload)
            ?? 'unknown';

        $videoId = $this->extractVideoId($payload);

        Log::channel('bunny')->info('Bunny webhook received', [
            'event_type' => $resolvedType,
            'video_id' => $videoId,
            'payload_keys' => array_keys($payload),
        ]);

        $normalized = $this->normalizePayload($payload, $resolvedType);

        return [
            'event_type' => $resolvedType,
            'data' => $normalized,
            'video_id' => $videoId,
            'valid' => in_array($resolvedType, self::KNOWN_EVENTS, true),
        ];
    }

    public function getWebhookSecret(): ?string
    {
        $settings = \App\Models\PlatformBunnySetting::active();

        return $settings?->signed_url_secret;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function extractEventType(array $payload): ?string
    {
        $rawType = $payload['Event']
            ?? $payload['event']
            ?? $payload['eventType']
            ?? $payload['event_type']
            ?? $payload['Type']
            ?? null;

        if ($rawType === null) {
            return $this->guessEventType($payload);
        }

        return $this->normalizeEventType((string) $rawType);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function guessEventType(array $payload): ?string
    {
        $status = $payload['encoding_status']
            ?? $payload['status']
            ?? $payload['Status']
            ?? null;

        if ($status !== null) {
            $statusStr = strtolower((string) $status);

            if (in_array($statusStr, ['4', 'ready', 'finished'], true)) {
                return 'video_ready';
            }

            if (in_array($statusStr, ['5', 'failed', 'error'], true)) {
                return 'video_failed';
            }
        }

        if (isset($payload['storageZoneName']) || isset($payload['storage_zone_name'])) {
            return 'storage_updated';
        }

        if (isset($payload['collectionId']) || isset($payload['collection_id'])) {
            return 'collection_updated';
        }

        return null;
    }

    private function normalizeEventType(string $type): string
    {
        $normalized = strtolower(trim($type));
        $normalized = preg_replace('/[^a-z0-9]+/', '_', $normalized);
        $normalized = trim($normalized, '_');

        $map = [
            'videoready' => 'video_ready',
            'video_ready' => 'video_ready',
            'videoencodingfinished' => 'video_encoding_finished',
            'encodingfinished' => 'video_encoding_finished',
            'video_encoding_finished' => 'video_encoding_finished',
            'uploadcompleted' => 'upload_completed',
            'upload_completed' => 'upload_completed',
            'videodeleted' => 'video_deleted',
            'video_deleted' => 'video_deleted',
            'storageupdated' => 'storage_updated',
            'storage_updated' => 'storage_updated',
            'collectionupdated' => 'collection_updated',
            'collection_updated' => 'collection_updated',
        ];

        return $map[$normalized] ?? $normalized;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function extractVideoId(array $payload): ?string
    {
        return $payload['VideoGuid']
            ?? $payload['videoGuid']
            ?? $payload['bunny_video_id']
            ?? $payload['video_id']
            ?? $payload['guid']
            ?? null;
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function normalizePayload(array $payload, string $eventType): array
    {
        return [
            'video_id' => $this->extractVideoId($payload),
            'encoding_status' => $payload['encoding_status']
                ?? $payload['status']
                ?? $payload['Status']
                ?? $payload['encodingStatus']
                ?? null,
            'duration' => $payload['duration_seconds']
                ?? $payload['duration']
                ?? $payload['length']
                ?? null,
            'thumbnail_url' => $payload['thumbnail_url']
                ?? $payload['thumbnailUrl']
                ?? null,
            'resolutions' => $payload['available_resolutions']
                ?? $payload['availableResolutions']
                ?? $payload['resolutions']
                ?? [],
            'collection_id' => $payload['collectionId']
                ?? $payload['collection_id']
                ?? null,
            'file_size' => $payload['file_size']
                ?? $payload['fileSize']
                ?? null,
            'storage_zone' => $payload['storageZoneName']
                ?? $payload['storage_zone_name']
                ?? null,
            'raw' => $payload,
        ];
    }
}
