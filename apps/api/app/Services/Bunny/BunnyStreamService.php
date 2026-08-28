<?php

namespace App\Services\Bunny;

use App\Services\Bunny\Contracts\BunnyStreamInterface;
use Illuminate\Support\Str;

class BunnyStreamService implements BunnyStreamInterface
{
    public function __construct(
        private readonly BunnyClient $client,
        private readonly BunnyCacheService $cache,
        private readonly BunnySignedUrlService $signedUrlService,
    ) {}

    public function createVideo(string $title, array $options = []): array
    {
        $settings = $this->client->settings();
        $libraryId = (string) $settings->library_id;
        $videoId = $options['video_id'] ?? (string) Str::uuid();

        $body = ['title' => $title];

        // Request the exact video id the caller reserved (if any) so the Bunny
        // video stays in sync with the asset's external_id. Bunny ignores this
        // field when absent and generates its own guid instead.
        $body['guid'] = $videoId;

        if (isset($options['collection_id'])) {
            $body['collectionId'] = $options['collection_id'];
        }

        if (isset($options['description'])) {
            $body['description'] = $options['description'];
        }

        $result = $this->client->streamRequest('POST', "library/{$libraryId}/videos", [
            'json' => $body,
            'operation' => "create_video {$videoId}",
        ]);

        $createdId = $result['guid'] ?? $result['videoId'] ?? $videoId;
        $result['video_id'] = $createdId;

        return $result;
    }

    public function deleteVideo(string $videoId): array
    {
        $settings = $this->client->settings();
        $libraryId = (string) $settings->library_id;

        $result = $this->client->streamRequest('DELETE', "library/{$libraryId}/videos/{$videoId}", [
            'operation' => "delete_video {$videoId}",
            'ignore_not_found' => true,
        ]);

        $this->cache->invalidateVideo($videoId);

        return $result;
    }

    public function updateMetadata(string $videoId, array $metadata): array
    {
        $settings = $this->client->settings();
        $libraryId = (string) $settings->library_id;

        $body = array_filter([
            'title' => $metadata['title'] ?? null,
            'description' => $metadata['description'] ?? null,
            'collectionId' => $metadata['collection_id'] ?? null,
            'thumbnailTime' => $metadata['thumbnail_time'] ?? null,
        ], fn ($v) => $v !== null);

        $result = $this->client->streamRequest('POST', "library/{$libraryId}/videos/{$videoId}", [
            'json' => $body,
            'operation' => "update_metadata {$videoId}",
        ]);

        $this->cache->invalidateVideo($videoId);

        return $result;
    }

    public function createCollection(string $name, array $options = []): array
    {
        $settings = $this->client->settings();
        $libraryId = (string) $settings->library_id;

        $body = ['name' => $name];

        if (isset($options['description'])) {
            $body['description'] = $options['description'];
        }

        return $this->client->streamRequest('POST', "library/{$libraryId}/collections", [
            'json' => $body,
            'operation' => "create_collection {$name}",
        ]);
    }

    public function deleteCollection(string $collectionId): array
    {
        $settings = $this->client->settings();
        $libraryId = (string) $settings->library_id;

        return $this->client->streamRequest('DELETE', "library/{$libraryId}/collections/{$collectionId}", [
            'operation' => "delete_collection {$collectionId}",
        ]);
    }

    public function generateThumbnail(string $videoId, array $options = []): array
    {
        $settings = $this->client->settings();
        $libraryId = (string) $settings->library_id;

        $time = $options['time'] ?? $settings->default_thumbnail_time ?? 0;

        $result = $this->client->streamRequest('GET', "library/{$libraryId}/videos/{$videoId}/thumbnail?thumbnailOffset={$time}", [
            'operation' => "generate_thumbnail {$videoId}",
        ]);

        $this->cache->invalidateVideo($videoId);

        return $result;
    }

    public function getVideoStatus(string $videoId): array
    {
        return $this->cache->cacheVideoMetadata("status:{$videoId}", function () use ($videoId) {
            $settings = $this->client->settings();
            $libraryId = (string) $settings->library_id;

            $result = $this->client->streamRequest('GET', "library/{$libraryId}/videos/{$videoId}", [
                'operation' => "get_video_status {$videoId}",
            ]);

            return [
                'video_id' => $videoId,
                'status' => $this->mapVideoStatus($result['status'] ?? $result['encodeStatus'] ?? null),
                'encoding_status' => $result['encodeStatus'] ?? null,
                'playback_url' => $result['playbackUrl'] ?? null,
                'thumbnail_url' => $result['thumbnailUrl'] ?? null,
                'preview_url' => $result['previewUrl'] ?? null,
                'duration' => $result['length'] ?? null,
                'resolutions' => $result['resolutions'] ?? [],
                'meta' => $result['metaTags'] ?? [],
                'created_at' => $result['dateCreated'] ?? null,
                'updated_at' => $result['lastChanged'] ?? null,
            ];
        });
    }

    public function getEncodingStatus(string $videoId): array
    {
        $status = $this->getVideoStatus($videoId);

        return [
            'video_id' => $videoId,
            'encoding_status' => $status['encoding_status'],
            'status' => $status['status'],
            'progress' => $this->encodingProgress($status['encoding_status']),
            'resolutions' => $status['resolutions'],
        ];
    }

    public function getPlaybackUrl(string $videoId): ?string
    {
        $status = $this->getVideoStatus($videoId);

        return $status['playback_url'] ?? null;
    }

    public function getHlsUrl(string $videoId): ?string
    {
        $playbackUrl = $this->getPlaybackUrl($videoId);

        if ($playbackUrl === null) {
            return null;
        }

        if (str_ends_with($playbackUrl, '.m3u8')) {
            return $playbackUrl;
        }

        return rtrim($playbackUrl, '/').'/'.$videoId.'/playlist.m3u8';
    }

    public function getDashUrl(string $videoId): ?string
    {
        $playbackUrl = $this->getPlaybackUrl($videoId);

        if ($playbackUrl === null) {
            return null;
        }

        return rtrim($playbackUrl, '/').'/'.$videoId.'/manifest.mpd';
    }

    public function generateSignedPlaybackUrl(string $videoId, array $options = []): ?string
    {
        $hlsUrl = $this->getHlsUrl($videoId);

        if ($hlsUrl === null) {
            return null;
        }

        if (! $this->client->settings()->enable_signed_urls) {
            return $hlsUrl;
        }

        return $this->signedUrlService->generateStreamSignedUrl($videoId, array_merge($options, [
            'playback_url' => $hlsUrl,
        ]));
    }

    private function mapVideoStatus(string|int|null $status): string
    {
        return match (strtolower(trim((string) $status))) {
            '0', 'created' => 'pending',
            '1', 'uploaded' => 'uploading',
            '2', 'processing', '3', 'transcoding' => 'processing',
            '4', 'ready', 'finished' => 'ready',
            '5', 'failed', 'error' => 'failed',
            default => 'pending',
        };
    }

    private function encodingProgress(?string $encodingStatus): int
    {
        return match (strtolower(trim((string) $encodingStatus))) {
            '0', 'created' => 0,
            '1', 'uploaded' => 10,
            '2', 'processing' => 50,
            '3', 'transcoding' => 75,
            '4', 'ready', 'finished' => 100,
            '5', 'failed', 'error' => -1,
            default => 0,
        };
    }
}
