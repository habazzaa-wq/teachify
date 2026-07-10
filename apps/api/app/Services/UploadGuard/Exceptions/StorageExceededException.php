<?php

namespace App\Services\UploadGuard\Exceptions;

class StorageExceededException extends QuotaExceededException
{
    public function __construct(
        int $usedBytes,
        int $limitBytes,
        int $remainingBytes,
        float $percentage,
        ?\Throwable $previous = null,
    ) {
        parent::__construct(
            'storage',
            $usedBytes,
            $limitBytes,
            $remainingBytes,
            $percentage,
            $previous,
        );
    }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'error' => 'storage_exceeded',
            'human_used' => $this->formatBytes($this->getUsed()),
            'human_limit' => $this->formatBytes($this->getLimit()),
            'human_remaining' => $this->formatBytes($this->getRemaining()),
        ]);
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = $bytes > 0 ? floor(log($bytes, 1024)) : 0;
        $power = min($power, count($units) - 1);
        $value = $bytes / (1024 ** $power);

        return round($value, 1) . ' ' . $units[(int) $power];
    }
}
