<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Infrastructure health endpoints.
 *
 * Liveness (GET /api/v1/health, GET /api/v1/health/live) reports the process
 * is alive and stays cheap (no external dependencies).
 *
 * Readiness (GET /api/v1/health/ready) reports the app can safely receive
 * traffic. It checks only critical configured dependencies: the database, and
 * a shared cache backend when one is configured. External providers (Bunny,
 * OpenAI / Vision) are intentionally NOT probed - their unavailability must
 * never fail readiness. Safe for unauthenticated infrastructure checks.
 */
class HealthController extends Controller
{
    public function liveness(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'version' => 'v1',
        ]);
    }

    public function readiness(): JsonResponse
    {
        $checks = [];
        $ready = true;

        // 1. Database - critical.
        try {
            DB::connection()->getPdo();
            $checks['database'] = 'ok';
        } catch (Throwable $e) {
            $ready = false;
            $checks['database'] = 'unavailable';
        }

        // 2. Shared cache backend, only when configured and actually shared.
        if ($ready && config('observability.readiness.check_cache', true) && $this->isSharedCacheDriver()) {
            try {
                Cache::get('__readiness_probe');
                $checks['cache'] = 'ok';
            } catch (Throwable $e) {
                $ready = false;
                $checks['cache'] = 'unavailable';
            }
        }

        if (! $ready) {
            return response()->json([
                'status' => 'not_ready',
                'checks' => $checks,
            ], 503);
        }

        return response()->json([
            'status' => 'ready',
            'checks' => $checks,
        ], 200);
    }

    private function isSharedCacheDriver(): bool
    {
        $driver = (string) config('cache.default');

        return in_array($driver, ['redis', 'memcached', 'dynamodb', 'octane'], true);
    }
}
