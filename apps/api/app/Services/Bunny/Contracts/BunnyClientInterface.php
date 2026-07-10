<?php

namespace App\Services\Bunny\Contracts;

use App\Models\PlatformBunnySetting;

interface BunnyClientInterface
{
    public function settings(): PlatformBunnySetting;

    public function storageRequest(string $method, string $path, array $options = []): array;

    public function streamRequest(string $method, string $path, array $options = []): array;

    public function storageZoneUrl(string $path = ''): string;

    public function streamBaseUrl(?string $region = null): string;

    public function cdnUrl(string $path = ''): string;
}
