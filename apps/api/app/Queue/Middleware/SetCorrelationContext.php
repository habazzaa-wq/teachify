<?php

namespace App\Queue\Middleware;

use App\Support\Correlation;
use Closure;
use Illuminate\Support\Facades\Log;

/**
 * Propagates request correlation into queued jobs and gives background /
 * scheduled jobs an independent correlation id.
 *
 * Works alongside SetTenantContext (tenant isolation) without altering retry
 * semantics. The correlation id is a primitive string injected into the job
 * payload at dispatch time (see ObservabilityServiceProvider); no Request
 * object is ever serialized.
 */
class SetCorrelationContext
{
    public function handle($job, Closure $next): void
    {
        $payload = method_exists($job, 'payload') ? $job->payload() : [];
        $correlationId = $payload['correlation_id'] ?? null;

        if (! is_string($correlationId) || $correlationId === '') {
            $correlationId = Correlation::generateForJob();
        }

        Correlation::set($correlationId);
        Log::withContext(['correlation_id' => $correlationId]);

        try {
            $next($job);
        } finally {
            Log::flushSharedContext();
            Correlation::set(null);
        }
    }
}
