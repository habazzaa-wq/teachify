<?php

namespace App\Http\Middleware;

use App\Support\Correlation;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Assigns a correlation id to every API request, echoes it back in the
 * response header, and attaches request / tenant / user context to logs.
 *
 * An incoming valid id is respected; otherwise a new one is generated. The id
 * is sanitized (alphanumeric, dash, dot, max 64 chars) so untrusted input
 * never reaches logs or responses verbatim.
 *
 * The shared log context is flushed at the start of each request so a
 * long-lived worker (artisan serve / Octane) never leaks one request's
 * tenant / user into the next.
 */
class RequestCorrelation
{
    private const ID_PATTERN = '/^[A-Za-z0-9_.\-]{1,64}$/';

    public function handle(Request $request, Closure $next): Response
    {
        Log::flushSharedContext();

        $id = $this->resolveRequestId($request);
        Correlation::set($id);
        Log::withContext(['request_id' => $id]);

        $start = microtime(true);
        $response = $next($request);
        $durationMs = (microtime(true) - $start) * 1000;

        $this->enrichContext($request);
        $this->logSlowRequest($request, $response, $durationMs);

        $response->headers->set(
            config('observability.request_id_header', 'X-Request-Id'),
            $id,
        );

        return $response;
    }

    private function resolveRequestId(Request $request): string
    {
        $header = config('observability.request_id_header', 'X-Request-Id');
        $incoming = (string) $request->header($header, '');

        if ($incoming !== '' && preg_match(self::ID_PATTERN, $incoming) === 1) {
            return $incoming;
        }

        return Correlation::generate();
    }

    private function enrichContext(Request $request): void
    {
        $context = [];

        if (app()->bound('currentTenant')) {
            $context['tenant_id'] = app('currentTenant')->id;
        }

        $user = $request->user();
        if ($user !== null) {
            $context['user_id'] = $user->id;
        }

        if ($context !== []) {
            Log::withContext($context);
        }
    }

    private function logSlowRequest(Request $request, Response $response, float $durationMs): void
    {
        $threshold = (int) config('observability.slow_request_ms', 1000);

        if ($threshold <= 0 || $durationMs < $threshold) {
            return;
        }

        Log::warning('http.request.slow', [
            'request_id' => Correlation::id(),
            'method' => $request->method(),
            'path' => $request->path(),
            'status' => $response->getStatusCode(),
            'duration_ms' => (int) $durationMs,
        ]);
    }
}
