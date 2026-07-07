<?php

namespace App\Http\Controllers\Api\v1\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\InvitationService;
use App\Services\Authorization\TenantAuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvitationController extends Controller
{
    public function store(
        Request $request,
        InvitationService $invitations,
        TenantAuthorizationService $authorization,
    ): JsonResponse {
        $authorization->authorize($request->user(), \currentTenant(), 'users.invite');

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['integer'],
        ]);

        $result = $invitations->create(
            \currentTenant(),
            $validated['email'],
            $validated['role_ids'],
            $request->user(),
        );

        $payload = [
            'message' => 'Invitation created.',
            'invitation' => [
                'id' => $result['invitation']->id,
                'email' => $result['invitation']->email,
                'normalized_email' => $result['invitation']->normalized_email,
                'status' => $result['invitation']->status,
                'expires_at' => $result['invitation']->expires_at,
            ],
        ];

        if (! app()->isProduction()) {
            $payload['token'] = $result['token'];
        }

        return response()->json($payload, 201);
    }

    public function accept(Request $request, InvitationService $invitations): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'name' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $membership = $invitations->accept(
            \currentTenant(),
            $validated['token'],
            $validated['name'] ?? null,
            $validated['password'] ?? null,
            $request->user(),
        );

        return response()->json([
            'message' => 'Invitation accepted.',
            'membership' => [
                'id' => $membership->id,
                'tenant_id' => $membership->tenant_id,
                'user_id' => $membership->user_id,
                'status' => $membership->status,
            ],
        ]);
    }
}
