<?php

namespace App\Services\Usage\Events;

class BandwidthLimitReached
{
    public function __construct(
        public readonly int $tenantId,
        public readonly int $usedBytes,
        public readonly int $limitBytes,
    ) {
    }
}
