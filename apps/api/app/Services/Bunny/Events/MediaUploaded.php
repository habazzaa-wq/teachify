<?php

namespace App\Services\Bunny\Events;

class MediaUploaded
{
    /**
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        public readonly int $tenantId,
        public readonly string $path,
        public readonly string $service,
        public readonly array $metadata = [],
    ) {
    }
}
