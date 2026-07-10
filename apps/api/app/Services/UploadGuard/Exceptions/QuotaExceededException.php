<?php

namespace App\Services\UploadGuard\Exceptions;

use RuntimeException;

class QuotaExceededException extends RuntimeException
{
    private string $quotaType;

    private int $used;

    private int $limit;

    private int $remaining;

    private float $percentage;

    public function __construct(
        string $quotaType,
        int $used,
        int $limit,
        int $remaining,
        float $percentage,
        ?\Throwable $previous = null,
    ) {
        $this->quotaType = $quotaType;
        $this->used = $used;
        $this->limit = $limit;
        $this->remaining = $remaining;
        $this->percentage = $percentage;

        parent::__construct(
            "Quota exceeded for {$quotaType}: {$used}/{$limit} ({$percentage}%)",
            403,
            $previous,
        );
    }

    public function getQuotaType(): string
    {
        return $this->quotaType;
    }

    public function getUsed(): int
    {
        return $this->used;
    }

    public function getLimit(): int
    {
        return $this->limit;
    }

    public function getRemaining(): int
    {
        return $this->remaining;
    }

    public function getPercentage(): float
    {
        return $this->percentage;
    }

    public function toArray(): array
    {
        return [
            'error' => 'quota_exceeded',
            'quota_type' => $this->quotaType,
            'used' => $this->used,
            'limit' => $this->limit,
            'remaining' => $this->remaining,
            'percentage' => $this->percentage,
            'message' => $this->getMessage(),
        ];
    }
}
