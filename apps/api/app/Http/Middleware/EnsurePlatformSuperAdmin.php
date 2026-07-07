<?php

namespace App\Http\Middleware;

use App\Services\Authorization\PlatformAuthorizationService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlatformSuperAdmin
{
    public function __construct(private readonly PlatformAuthorizationService $platform)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! $this->platform->isPlatformSuperAdmin($user)) {
            return response()->json(['message' => 'Platform authorization required.'], 403);
        }

        return $next($request);
    }
}
