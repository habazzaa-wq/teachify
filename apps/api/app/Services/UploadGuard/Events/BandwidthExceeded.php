<?php

namespace App\Services\UploadGuard\Events;

class BandwidthExceeded
{
    public function __construct(
        public readonly int $tenantId,
        public readonly int $usedBytes,
        public readonly int $limitBytes,
        public readonly float $percentage,
        public readonly string $uploadType,
    ) {
    }
}
