<?php

namespace App\Services\Access;

class AccessEvaluation
{
    /**
     * @param array<int, string> $reasons
     * @param array<string, mixed> $context
     */
    public function __construct(
        public readonly bool $allowed,
        public readonly array $reasons = [],
        public readonly array $context = [],
    ) {
    }
}
