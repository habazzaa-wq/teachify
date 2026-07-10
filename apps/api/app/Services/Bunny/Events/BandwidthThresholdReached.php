<?php

namespace App\Services\Bunny\Events;

class BandwidthThresholdReached
{
    public function __construct(
        public readonly int $tenantId,
        public readonly int $usedBytes,
        public readonly int $thresholdBytes,
        public readonly float $percentage,
    ) {
    }
}
