<?php

namespace App\Services\Bunny\Contracts;

interface BunnySignedUrlInterface
{
    public function generateStorageSignedUrl(string $path, array $options = []): string;

    public function generateStreamSignedUrl(string $videoId, array $options = []): string;

    public function validateSignedUrl(string $url): bool;

    public function getExpirationFromSignedUrl(string $url): ?int;
}
