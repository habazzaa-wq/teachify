<?php

namespace App\Services\Bunny;

use App\Services\Bunny\Contracts\BunnySignedUrlInterface;
use App\Services\Bunny\Exceptions\BunnyServiceException;

class BunnySignedUrlService implements BunnySignedUrlInterface
{
    public function __construct(
        private readonly BunnyClient $client,
    ) {
    }

    public function generateStorageSignedUrl(string $path, array $options = []): string
    {
        $secret = $this->client->settings()->signed_url_secret;

        if (! $secret) {
            throw new BunnyServiceException(
                'Signed URL secret is not configured. Cannot generate signed URLs.',
                'signed_url',
                'generate_storage_signed_url',
            );
        }

        $normalizedPath = '/'.ltrim($path, '/');
        $expiresAt = $this->resolveExpiration($options);

        $hash = hash_hmac('sha256', $normalizedPath.$expiresAt, $secret, true);
        $token = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($hash));

        $baseUrl = $this->client->cdnUrl($normalizedPath);

        return $baseUrl.'?token='.$token.'&expires='.$expiresAt;
    }

    public function generateStreamSignedUrl(string $videoId, array $options = []): string
    {
        $secret = $this->client->settings()->signed_url_secret;

        if (! $secret) {
            throw new BunnyServiceException(
                'Signed URL secret is not configured. Cannot generate signed playback URLs.',
                'signed_url',
                'generate_stream_signed_url',
            );
        }

        $playbackUrl = $options['playback_url'] ?? $this->buildHlsUrl($videoId);

        if ($playbackUrl === null) {
            throw new BunnyServiceException(
                "No playback URL available for video {$videoId}.",
                'signed_url',
                'generate_stream_signed_url',
                ['video_id' => $videoId],
            );
        }

        $expiresAt = $this->resolveExpiration($options);

        $hash = hash_hmac('sha256', $playbackUrl.$expiresAt, $secret, true);
        $token = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($hash));

        return $playbackUrl.'?token='.$token.'&expires='.$expiresAt;
    }

    public function validateSignedUrl(string $url): bool
    {
        $secret = $this->client->settings()->signed_url_secret;

        if (! $secret) {
            return false;
        }

        $parsed = parse_url($url);

        if ($parsed === false || ! isset($parsed['query'])) {
            return false;
        }

        parse_str($parsed['query'], $params);

        if (! isset($params['token']) || ! isset($params['expires'])) {
            return false;
        }

        $expires = (int) $params['expires'];

        if ($expires < time()) {
            return false;
        }

        $path = $parsed['path'] ?? '/';
        $hash = hash_hmac('sha256', $path.$expires, $secret, true);
        $expectedToken = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($hash));

        return hash_equals($expectedToken, $params['token']);
    }

    public function getExpirationFromSignedUrl(string $url): ?int
    {
        $parsed = parse_url($url);

        if ($parsed === false || ! isset($parsed['query'])) {
            return null;
        }

        parse_str($parsed['query'], $params);

        return isset($params['expires']) ? (int) $params['expires'] : null;
    }

    /**
     * @param array<string, mixed> $options
     */
    private function resolveExpiration(array $options): int
    {
        if (isset($options['expires_at'])) {
            $expiresAt = $options['expires_at'];

            if (is_numeric($expiresAt)) {
                return (int) $expiresAt;
            }

            return (int) strtotime((string) $expiresAt);
        }

        $expirationDays = $this->client->settings()->default_expiration_days;

        if ($expirationDays !== null && $expirationDays > 0) {
            return now()->addDays($expirationDays)->timestamp;
        }

        return now()->addHour()->timestamp;
    }

    private function buildHlsUrl(string $videoId): ?string
    {
        $pullZone = $this->client->settings()->cdn_hostname;

        if (! $pullZone) {
            return null;
        }

        return 'https://'.trim((string) $pullZone, '/').'/'.$videoId.'/playlist.m3u8';
    }
}
