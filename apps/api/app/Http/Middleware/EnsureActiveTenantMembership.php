<?php

namespace App\Http\Middleware;

use App\Models\TenantUser;
use App\Services\Auth\TenantMembershipService;
use App\Services\Instructors\InstructorFeature;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
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

        $token = $user->currentAccessToken();
        $instructorToken = $token instanceof PersonalAccessToken
            && collect($token->abilities)->contains(fn (string $ability): bool => str_starts_with($ability, 'instructor:'));
        $instructorRole = $membership->roles()->where('roles.slug', 'instructor')->exists();
        if ($instructorToken || $membership->is_instructor
            || (app(InstructorFeature::class)->isEnabled(currentTenant()) && $instructorRole)) {
            return response()->json(['message' => 'Instructor credentials are restricted to the instructor context.'], 403);
        }

        $this->memberships->touchLastAccessed($membership);

        app()->instance(TenantUser::class, $membership->refresh());
        app()->instance('currentTenantMembership', $membership);

        return $next($request);
    }
}
