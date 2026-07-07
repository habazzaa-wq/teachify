<?php

namespace App\Http\Controllers\Api\v1\Auth;

use App\Http\Controllers\Controller;
use App\Services\Tenant\TenantUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class TenantUserController extends Controller
{
    public function __construct(private readonly TenantUserService $service) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', \App\Models\TenantUser::class);

        $users = $this->service->list($request->all());

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', \App\Models\TenantUser::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'password' => ['required', 'string', 'min:8'],
            'department' => ['nullable', 'string', 'max:100'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'avatar' => ['nullable', 'string', 'max:255'],
            'locale' => ['sometimes', 'string', 'max:10'],
            'timezone' => ['sometimes', 'string', 'max:64'],
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'suspended', 'pending'])],
            'notes' => ['nullable', 'string', 'max:5000'],
            'role_ids' => ['sometimes', 'array'],
            'role_ids.*' => ['integer', Rule::exists('roles', 'id')->where('tenant_id', currentTenant()->id)],
        ]);

        $membership = $this->service->create($validated);

        return response()->json([
            'message' => 'User created successfully.',
            'data' => $this->formatUser($membership),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $membership = $this->service->get($id);

        abort_if($membership->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('view', $membership);

        return response()->json([
            'data' => $this->formatUser($membership),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $membership = $this->service->get($id);

        abort_if($membership->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $membership);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'password' => ['sometimes', 'string', 'min:8', 'nullable'],
            'department' => ['nullable', 'string', 'max:100'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'avatar' => ['nullable', 'string', 'max:255'],
            'locale' => ['sometimes', 'string', 'max:10'],
            'timezone' => ['sometimes', 'string', 'max:64'],
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'suspended', 'pending'])],
            'notes' => ['nullable', 'string', 'max:5000'],
            'role_ids' => ['sometimes', 'array'],
            'role_ids.*' => ['integer', Rule::exists('roles', 'id')->where('tenant_id', currentTenant()->id)],
        ]);

        $membership = $this->service->update($id, $validated);

        return response()->json([
            'message' => 'User updated successfully.',
            'data' => $this->formatUser($membership),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);

        return response()->json(['message' => 'User deleted successfully.']);
    }

    public function restore(int $id): JsonResponse
    {
        Gate::authorize('create', \App\Models\TenantUser::class);

        $membership = $this->service->restore($id);

        return response()->json([
            'message' => 'User restored successfully.',
            'data' => $this->formatUser($membership),
        ]);
    }

    public function activate(int $id): JsonResponse
    {
        $membership = $this->service->get($id);
        Gate::authorize('update', $membership);

        $membership = $this->service->activate($id);

        return response()->json([
            'message' => 'User activated successfully.',
            'data' => $this->formatUser($membership),
        ]);
    }

    public function suspend(int $id): JsonResponse
    {
        $membership = $this->service->get($id);
        Gate::authorize('update', $membership);

        $membership = $this->service->suspend($id);

        return response()->json([
            'message' => 'User suspended successfully.',
            'data' => $this->formatUser($membership),
        ]);
    }

    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $membership = $this->service->get($id);
        Gate::authorize('update', $membership);

        $password = $this->service->resetPassword($id);

        return response()->json([
            'message' => 'Password reset successfully.',
            'password' => $password,
        ]);
    }

    public function metrics(): JsonResponse
    {
        Gate::authorize('viewAny', \App\Models\TenantUser::class);

        return response()->json([
            'data' => $this->service->getMetrics(),
        ]);
    }

    public function export(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        Gate::authorize('viewAny', \App\Models\TenantUser::class);

        return $this->service->exportCsv($request->all());
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        Gate::authorize('create', \App\Models\TenantUser::class);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $count = $this->service->bulkDelete($validated['ids']);

        return response()->json([
            'message' => "{$count} user(s) deleted successfully.",
            'count' => $count,
        ]);
    }

    public function bulkRestore(Request $request): JsonResponse
    {
        Gate::authorize('create', \App\Models\TenantUser::class);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $count = $this->service->bulkRestore($validated['ids']);

        return response()->json([
            'message' => "{$count} user(s) restored successfully.",
            'count' => $count,
        ]);
    }

    public function bulkActivate(Request $request): JsonResponse
    {
        Gate::authorize('create', \App\Models\TenantUser::class);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $count = $this->service->bulkActivate($validated['ids']);

        return response()->json([
            'message' => "{$count} user(s) activated successfully.",
            'count' => $count,
        ]);
    }

    public function bulkSuspend(Request $request): JsonResponse
    {
        Gate::authorize('create', \App\Models\TenantUser::class);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $count = $this->service->bulkSuspend($validated['ids']);

        return response()->json([
            'message' => "{$count} user(s) suspended successfully.",
            'count' => $count,
        ]);
    }

    public function activities(int $id): JsonResponse
    {
        Gate::authorize('view', \App\Models\TenantUser::class);

        return response()->json([
            'data' => $this->service->getActivities($id),
        ]);
    }

    public function sessions(int $id): JsonResponse
    {
        Gate::authorize('view', \App\Models\TenantUser::class);

        return response()->json([
            'data' => $this->service->getSessions($id),
        ]);
    }

    public function forceLogout(int $id): JsonResponse
    {
        $membership = $this->service->get($id);
        Gate::authorize('update', $membership);

        $this->service->forceLogout($id);

        return response()->json(['message' => 'All sessions revoked successfully.']);
    }

    public function revokeSession(int $id, int $sessionId): JsonResponse
    {
        $membership = $this->service->get($id);
        Gate::authorize('update', $membership);

        $this->service->revokeSession($id, $sessionId);

        return response()->json(['message' => 'Session revoked successfully.']);
    }

    private function formatUser(\App\Models\TenantUser $membership): array
    {
        $user = $membership->user;

        return [
            'id' => (string) $membership->id,
            'tenantId' => (string) $membership->tenant_id,
            'avatar' => $membership->avatar ?? $user->avatar,
            'fullName' => $user->name,
            'email' => $user->email,
            'phone' => $membership->phone ?? $user->phone,
            'department' => $membership->department,
            'jobTitle' => $membership->job_title,
            'role' => $membership->roles->first() ? [
                'id' => (string) $membership->roles->first()->id,
                'name' => $membership->roles->first()->name,
                'slug' => $membership->roles->first()->slug,
            ] : null,
            'roles' => $membership->roles->map(fn ($r) => [
                'id' => (string) $r->id,
                'name' => $r->name,
                'slug' => $r->slug,
            ]),
            'permissions' => $membership->roles->flatMap->permissions->unique('id')->values()->map(fn ($p) => [
                'id' => (string) $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
            ]),
            'status' => $membership->status,
            'twoFactorEnabled' => false,
            'language' => $membership->locale ?? $user->locale ?? 'ar',
            'timezone' => $membership->timezone ?? $user->timezone ?? 'UTC',
            'lastLogin' => $membership->last_login_at?->toIso8601String(),
            'lastPasswordChange' => null,
            'recoveryEmail' => null,
            'notes' => $membership->notes ?? '',
            'createdAt' => $membership->created_at->toIso8601String(),
            'updatedAt' => $membership->updated_at->toIso8601String(),
        ];
    }
}
