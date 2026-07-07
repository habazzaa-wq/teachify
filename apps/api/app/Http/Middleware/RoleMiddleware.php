<?php

namespace App\Http\Middleware;

use App\Services\Authorization\AuthorizationService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function __construct(private readonly AuthorizationService $authorization)
    {
    }

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (empty($roles)) {
            return $next($request);
        }

        if (! $this->authorization->hasAnyRole($user, $roles)) {
            return response()->json([
                'message' => 'Insufficient role. Required one of: ' . implode(', ', $roles),
                'error' => 'INSUFFICIENT_ROLE',
            ], 403);
        }

        return $next($request);
    }
}
