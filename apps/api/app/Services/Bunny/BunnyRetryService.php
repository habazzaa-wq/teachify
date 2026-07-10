<?php

namespace App\Services\Bunny;

class BunnyRetryService
{
    private const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];

    private const BASE_DELAY_MS = 500;

    private const MAX_DELAY_MS = 30_000;

    private const BACKOFF_MULTIPLIER = 2;

    /**
     * @param int $status HTTP status code (0 for network failures)
     */
    public function shouldRetry(int $status, int $attempt, int $maxAttempts): bool
    {
        if ($attempt >= $maxAttempts) {
            return false;
        }

        if ($status === 0) {
            return $attempt < $maxAttempts;
        }

        return in_array($status, self::RETRYABLE_STATUSES, true);
    }

    /**
     * @param int|string|null $retryAfter Header value in seconds
     */
    public function calculateDelay(int $attempt, int|string|null $retryAfter = null): int
    {
        if ($retryAfter !== null && $retryAfter !== '') {
            $retryAfterSeconds = (int) $retryAfter;

            return min($retryAfterSeconds * 1000, self::MAX_DELAY_MS);
        }

        $delay = self::BASE_DELAY_MS * (self::BACKOFF_MULTIPLIER ** ($attempt - 1));

        $jitter = (int) (mt_rand(0, (int) ($delay * 0.1)));

        return min($delay + $jitter, self::MAX_DELAY_MS);
    }

    public function isRetryableStatus(int $status): bool
    {
        return in_array($status, self::RETRYABLE_STATUSES, true);
    }
}
