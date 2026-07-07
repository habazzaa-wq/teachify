<?php

namespace App\Http\Controllers\Api\v1\Access;

use App\Http\Controllers\Controller;
use App\Http\Requests\Access\MatrixCloneRequest;
use App\Http\Requests\Access\MatrixUpdateRequest;
use App\Repositories\RolePermissionRepository;
use App\Services\Authorization\AuthorizationService;
use App\Services\Authorization\PermissionService;
use Illuminate\Http\JsonResponse;

class MatrixController extends Controller
{
    public function __construct(
        private readonly RolePermissionRepository $roles,
        private readonly PermissionService $permissions,
        private readonly AuthorizationService $authorization,
    ) {}

    public function index(): JsonResponse
    {
        $this->authorization->authorize(request()->user(), 'permissions.manage');

        $tenantId = currentTenant()->id;

        return response()->json(
            $this->roles->getRoleMatrix($tenantId)
        );
    }

    public function update(MatrixUpdateRequest $request): JsonResponse
    {
        $this->authorization->authorize($request->user(), 'permissions.manage');

        $tenantId = currentTenant()->id;
        $roleId = (int) $request->input('role_id');
        $permissionIds = $request->input('permission_ids', []);

        $permissionIds = collect($permissionIds)
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        $this->roles->updateRolePermissions($roleId, $permissionIds, $tenantId);

        $this->permissions->clearAllUserCaches($tenantId);

        return response()->json([
            'message' => 'Role permissions updated successfully.',
        ]);
    }

    public function clone(MatrixCloneRequest $request): JsonResponse
    {
        $this->authorization->authorize($request->user(), 'permissions.manage');

        $tenantId = currentTenant()->id;
        $sourceRoleId = (int) $request->input('source_role_id');
        $targetRoleId = (int) $request->input('target_role_id');

        $this->roles->clonePermissions($sourceRoleId, $targetRoleId, $tenantId);

        $this->permissions->clearAllUserCaches($tenantId);

        return response()->json([
            'message' => 'Permissions cloned successfully.',
        ]);
    }
}
