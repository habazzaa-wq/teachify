<?php

namespace App\Services\Bunny\Events;

class VideoReady
{
    /**
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        public readonly int $tenantId,
        public readonly string $videoId,
        public readonly array $metadata = [],
    ) {
    }
}
