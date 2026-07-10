<?php

namespace App\Services\UploadGuard\Events;

class UploadRejected
{
    public function __construct(
        public readonly int $tenantId,
        public readonly string $reason,
        public readonly string $uploadType,
        public readonly array $context = [],
    ) {
    }
}
