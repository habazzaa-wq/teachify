<?php

namespace App\Services\Usage\Events;

class StorageWarning
{
    public function __construct(
        public readonly int $tenantId,
        public readonly int $usedBytes,
        public readonly int $thresholdBytes,
        public readonly float $percentage,
    ) {
    }
}
