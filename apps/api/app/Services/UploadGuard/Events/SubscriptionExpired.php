<?php

namespace App\Services\UploadGuard\Events;

class SubscriptionExpired
{
    public function __construct(
        public readonly int $tenantId,
        public readonly string $uploadType,
        public readonly array $context = [],
    ) {
    }
}
