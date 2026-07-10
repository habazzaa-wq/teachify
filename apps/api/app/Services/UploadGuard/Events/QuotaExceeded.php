<?php

namespace App\Services\UploadGuard\Events;

class QuotaExceeded
{
    public function __construct(
        public readonly int $tenantId,
        public readonly string $quotaType,
        public readonly int $used,
        public readonly int $limit,
        public readonly float $percentage,
        public readonly string $uploadType,
    ) {
    }
}
