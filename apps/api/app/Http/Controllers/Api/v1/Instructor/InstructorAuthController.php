<?php

namespace App\Http\Controllers\Api\v1\Instructor;

use App\Http\Controllers\Controller;
use App\Models\TenantUser;
use App\Services\Instructors\InstructorAuthenticationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstructorAuthController extends Controller
{
    public function login(Request $request, InstructorAuthenticationService $auth): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string'],
        ]);
        $result = $auth->login(currentTenant(), $validated['email'], $validated['password']);
        $membership = $result['membership'];

        return response()->json([
            'message' => 'Authenticated.',
            'access_token' => $result['access_token']->plainTextToken,
            'refresh_token' => $result['refresh_token']?->plainTextToken,
            'token_type' => 'Bearer',
            'must_change_password' => $membership->must_change_password,
            'user' => [
                'id' => $result['user']->id,
                'name' => $result['user']->name,
                'email' => $result['user']->email,
                'avatar' => $membership->avatar ?? $result['user']->avatar,
            ],
            'membership' => [
                'id' => $membership->id,
                'tenant_id' => $membership->tenant_id,
                'status' => $membership->status,
            ],
        ]);
    }

    public function refresh(Request $request, InstructorAuthenticationService $auth): JsonResponse
    {
        $validated = $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        $tokens = $auth->refresh(currentTenant(), $validated['refresh_token']);

        return response()->json([
            'message' => 'Token refreshed.',
            'access_token' => $tokens['access_token']->plainTextToken,
            'token_type' => 'Bearer',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var TenantUser $membership */
        $membership = $request->attributes->get('instructorMembership');

        return response()->json([
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'avatar' => $membership->avatar ?? $request->user()->avatar,
            ],
            'membership' => [
                'id' => $membership->id,
                'tenant_id' => $membership->tenant_id,
                'must_change_password' => $membership->must_change_password,
            ],
        ]);
    }

    public function changePassword(Request $request, InstructorAuthenticationService $auth): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        /** @var TenantUser $membership */
        $membership = $request->attributes->get('instructorMembership');
        $tokens = $auth->changePassword($request->user(), $membership, $validated['password']);

        return response()->json([
            'message' => 'Password changed.',
            'access_token' => $tokens['access_token']->plainTextToken,
            'refresh_token' => $tokens['refresh_token']->plainTextToken,
            'token_type' => 'Bearer',
            'must_change_password' => false,
        ]);
    }

    public function logout(Request $request, InstructorAuthenticationService $auth): JsonResponse
    {
        $auth->revokeCurrentToken($request->user());

        return response()->json(['message' => 'Logged out.']);
    }
}
