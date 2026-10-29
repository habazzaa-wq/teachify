<?php

namespace App\Http\Middleware;

use App\Models\TenantUser;
use App\Services\Instructors\InstructorFeature;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class EnsureInstructorContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $tenant = currentTenant();
        app(InstructorFeature::class)->ensureEnabled($tenant);

        $token = $user->currentAccessToken();
        if (! $token instanceof PersonalAccessToken
            || $token->name !== 'instructor_access_token'
            || ! in_array('instructor:tenant:'.$tenant->id, $token->abilities, true)
            || (! in_array('instructor:access', $token->abilities, true)
                && ! in_array('instructor:password-change', $token->abilities, true))) {
            return response()->json(['message' => 'Instructor token required.'], 403);
        }

        $membership = TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->where('is_instructor', true)
            ->with('roles')
            ->first();

        if (! $membership || $membership->roles->count() !== 1 || $membership->roles->first()?->slug !== 'instructor') {
            return response()->json(['message' => 'Active instructor membership required.'], 403);
        }

        $request->attributes->set('instructorMembership', $membership);
        app()->instance(TenantUser::class, $membership);
        app()->instance('currentTenantMembership', $membership);

        if ($membership->must_change_password
            && ! in_array($request->route()?->getName(), ['instructor.auth.change-password', 'instructor.auth.logout'], true)) {
            return response()->json([
                'message' => 'A password change is required before continuing.',
                'error' => 'PASSWORD_CHANGE_REQUIRED',
            ], 403);
        }

        return $next($request);
    }
}
