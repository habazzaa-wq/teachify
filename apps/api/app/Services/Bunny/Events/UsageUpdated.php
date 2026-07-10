<?php

namespace App\Services\Bunny\Events;

class UsageUpdated
{
    /**
     * @param array<string, mixed> $usage
     */
    public function __construct(
        public readonly array $usage,
    ) {
    }
}
