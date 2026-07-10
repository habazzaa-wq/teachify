<?php

namespace App\Services\Usage\Events;

class QuotaRecovered
{
    public function __construct(
        public readonly int $tenantId,
        public readonly string $field,
        public readonly int $used,
        public readonly int $limit,
        public readonly float $percentage,
    ) {
    }
}
