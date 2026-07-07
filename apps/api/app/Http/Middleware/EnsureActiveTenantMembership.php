<?php

namespace App\Http\Middleware;

use App\Models\TenantUser;
use App\Services\Auth\TenantMembershipService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveTenantMembership
{
    public function __construct(private readonly TenantMembershipService $memberships)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $membership = $this->memberships->activeMembership($user, \currentTenant());

        if (! $membership) {
            return response()->json(['message' => 'Active tenant membership required.'], 403);
        }

        $this->memberships->touchLastAccessed($membership);

        app()->instance(TenantUser::class, $membership->refresh());
        app()->instance('currentTenantMembership', $membership);

        return $next($request);
    }
}
