<?php

namespace App\Services\Usage\Events;

class ViewsWarning
{
    public function __construct(
        public readonly int $tenantId,
        public readonly int $usedViews,
        public readonly int $thresholdViews,
        public readonly float $percentage,
    ) {
    }
}
