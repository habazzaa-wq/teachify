<?php

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Services\Auth\PlatformAuthenticationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformAuthController extends Controller
{
    public function login(Request $request, PlatformAuthenticationService $auth): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $result = $auth->login($validated['email'], $validated['password']);

        return response()->json([
            'message' => 'Authenticated.',
            'token' => $result['token']->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $this->userPayload($result['user']),
            'platform_admin' => $this->platformAdminPayload($result['platform_admin']),
        ]);
    }

    public function logout(Request $request, PlatformAuthenticationService $auth): JsonResponse
    {
        $auth->logout($request->user());

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $platformAdmin = $user->platformAdmin()
            ->where('status', 'active')
            ->firstOrFail();

        return response()->json([
            'user' => $this->userPayload($user),
            'platform_admin' => $this->platformAdminPayload($platformAdmin),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(\App\Models\User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function platformAdminPayload(\App\Models\PlatformAdmin $platformAdmin): array
    {
        return [
            'id' => $platformAdmin->id,
            'status' => $platformAdmin->status,
            'role' => $platformAdmin->role ?? 'super_admin',
            'granted_at' => $platformAdmin->granted_at,
        ];
    }
}
