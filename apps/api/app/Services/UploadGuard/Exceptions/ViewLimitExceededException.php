<?php

namespace App\Services\UploadGuard\Exceptions;

class ViewLimitExceededException extends QuotaExceededException
{
    public function __construct(
        int $usedViews,
        int $limitViews,
        int $remainingViews,
        float $percentage,
        ?\Throwable $previous = null,
    ) {
        parent::__construct(
            'views',
            $usedViews,
            $limitViews,
            $remainingViews,
            $percentage,
            $previous,
        );
    }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'error' => 'views_exceeded',
        ]);
    }
}
