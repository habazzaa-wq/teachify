<?php

namespace App\Services\UploadGuard\Exceptions;

use RuntimeException;

class PlanRequiredException extends RuntimeException
{
    public function __construct(
        string $feature = 'uploads',
        ?\Throwable $previous = null,
    ) {
        parent::__construct(
            "A subscription plan is required for {$feature}. Please subscribe to a plan.",
            403,
            $previous,
        );
    }

    public function toArray(): array
    {
        return [
            'error' => 'plan_required',
            'message' => $this->getMessage(),
        ];
    }
}
