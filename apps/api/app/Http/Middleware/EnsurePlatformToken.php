<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensures platform API routes are accessed with a platform-scoped Sanctum token.
 * Tenant session cookies without the platform:access ability are rejected.
 */
class EnsurePlatformToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $token = $user->currentAccessToken();

        if ($token !== null && ! $token->can('platform:access')) {
            return response()->json(['message' => 'Platform token required.'], 403);
        }

        return $next($request);
    }
}
