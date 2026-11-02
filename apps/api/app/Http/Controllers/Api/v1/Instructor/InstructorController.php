<?php

namespace App\Http\Controllers\Api\v1\Instructor;

use App\Http\Controllers\Controller;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Instructors\InstructorAccountService;
use App\Services\Instructors\InstructorDeletionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InstructorController extends Controller
{
    public function index(Request $request, InstructorAccountService $instructors, TenantAuthorizationService $authorization): JsonResponse
    {
        $tenant = currentTenant();
        $authorization->authorize($request->user(), $tenant, 'users.view');

        return response()->json(['data' => $instructors->list($tenant)]);
    }

    public function options(Request $request, InstructorAccountService $instructors, TenantAuthorizationService $authorization): JsonResponse
    {
        $tenant = currentTenant();
        $authorization->authorize($request->user(), $tenant, 'courses.assign_instructors');

        return response()->json(['data' => $instructors->options($tenant)]);
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

    public function updateStatus(Request $request, int $instructor, InstructorAccountService $instructors, TenantAuthorizationService $authorization): JsonResponse
    {
        $tenant = currentTenant();
        $authorization->authorize($request->user(), $tenant, 'users.manage');
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'suspended'])],
        ]);
        $membership = $instructors->updateStatus($tenant, $instructor, $validated['status']);

        return response()->json([
            'message' => 'Instructor status updated.',
            'data' => [
                'id' => $membership->id,
                'status' => $membership->status,
            ],
        ]);
    }

    public function resetPassword(Request $request, int $instructor, InstructorAccountService $instructors, TenantAuthorizationService $authorization): JsonResponse
    {
        $tenant = currentTenant();
        $authorization->authorize($request->user(), $tenant, 'users.manage');
        $result = $instructors->resetPassword($tenant, $instructor);

        return response()->json([
            'message' => 'Instructor password reset.',
            'temporary_password' => $result['temporary_password'],
            'must_change_password' => true,
        ]);
    }

    public function destroy(
        Request $request,
        int $instructor,
        InstructorDeletionService $deletion,
        TenantAuthorizationService $authorization,
    ): JsonResponse {
        $tenant = currentTenant();
        $authorization->authorize($request->user(), $tenant, 'users.manage');
        $validated = $request->validate([
            'strategy' => ['required', Rule::in(['delete_content', 'transfer_to_instructor', 'transfer_to_tenant'])],
            'target_instructor_id' => ['required_if:strategy,transfer_to_instructor', 'nullable', 'integer'],
        ]);

        $deletion->remove(
            $tenant,
            currentTenantUser(),
            $instructor,
            $validated['strategy'],
            isset($validated['target_instructor_id']) ? (int) $validated['target_instructor_id'] : null,
        );

        return response()->json(['message' => 'Instructor removed successfully.']);
    }
}
