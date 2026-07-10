<?php

namespace App\Services\Bunny\Events;

class MediaDeleted
{
    public function __construct(
        public readonly int $tenantId,
        public readonly string $path,
        public readonly string $service,
    ) {
    }
}
