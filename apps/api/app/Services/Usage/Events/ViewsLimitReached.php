<?php

namespace App\Services\Usage\Events;

class ViewsLimitReached
{
    public function __construct(
        public readonly int $tenantId,
        public readonly int $usedViews,
        public readonly int $limitViews,
    ) {
    }
}
