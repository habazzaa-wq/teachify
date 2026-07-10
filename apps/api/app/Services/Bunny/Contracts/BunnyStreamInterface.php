<?php

namespace App\Services\Bunny\Contracts;

interface BunnyStreamInterface
{
    public function createVideo(string $title, array $options = []): array;

    public function deleteVideo(string $videoId): array;

    public function updateMetadata(string $videoId, array $metadata): array;

    public function createCollection(string $name, array $options = []): array;

    public function deleteCollection(string $collectionId): array;

    public function generateThumbnail(string $videoId, array $options = []): array;

    public function getVideoStatus(string $videoId): array;

    public function getEncodingStatus(string $videoId): array;

    public function getPlaybackUrl(string $videoId): ?string;

    public function getHlsUrl(string $videoId): ?string;

    public function getDashUrl(string $videoId): ?string;

    public function generateSignedPlaybackUrl(string $videoId, array $options = []): ?string;
}
