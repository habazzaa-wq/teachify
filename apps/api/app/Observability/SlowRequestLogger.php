<?php

namespace App\Observability;

use App\Support\Correlation;
use Illuminate\Support\Facades\Log;

/**
 * Logs slow HTTP requests with correlation / route context.
 *
 * Pure timing logic kept separate from the middleware so it can be unit
 * tested without real wall-clock assertions.
 */
class SlowRequestLogger
{
    public function logIfSlow(float $durationMs, array $context): void
    {
        $threshold = (int) config('observability.slow_request_ms', 1000);

        if ($threshold <= 0 || $durationMs < $threshold) {
            return;
        }

        Log::warning('http.request.slow', array_merge([
            'request_id' => Correlation::id(),
            'duration_ms' => (int) $durationMs,
        ], $context));
    }
}
