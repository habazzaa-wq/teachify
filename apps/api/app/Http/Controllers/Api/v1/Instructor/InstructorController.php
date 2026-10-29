<?php

namespace App\Http\Controllers\Api\v1\Instructor;

use App\Http\Controllers\Controller;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Instructors\InstructorAccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstructorController extends Controller
{
    public function index(Request $request, InstructorAccountService $instructors, TenantAuthorizationService $authorization): JsonResponse
    {
        $tenant = currentTenant();
        $authorization->authorize($request->user(), $tenant, 'users.view');

        return response()->json(['data' => $instructors->list($tenant)]);
    }

    public function store(Request $request, InstructorAccountService $instructors, TenantAuthorizationService $authorization): JsonResponse
    {
        $tenant = currentTenant();
        $authorization->authorize($request->user(), $tenant, 'users.manage');
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
        ]);
        $result = $instructors->create($tenant, $validated['name'], $validated['email']);
        $membership = $result['membership'];

        return response()->json([
            'message' => 'Instructor created.',
            'data' => [
                'id' => $membership->id,
                'name' => $membership->user->name,
                'email' => $membership->user->email,
                'avatar' => $membership->avatar ?? $membership->user->avatar,
                'status' => $membership->status,
            ],
            'temporary_password' => $result['temporary_password'],
        ], 201);
    }
}
