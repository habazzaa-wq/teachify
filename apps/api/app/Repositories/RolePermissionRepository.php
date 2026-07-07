<?php

namespace App\Repositories;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Support\Facades\Cache;

class RolePermissionRepository
{
    public function getRolePermissions(int $roleId): array
    {
        $role = Role::query()->with('permissions')->findOrFail($roleId);

        return $role->permissions->pluck('slug')->all();
    }

    public function getRoleMatrix(int $tenantId): array
    {
        return Cache::remember("tenant.{$tenantId}.permission_matrix", 3600, function () use ($tenantId) {
            $roles = Role::query()
                ->with('permissions')
                ->where('tenant_id', $tenantId)
                ->orderBy('name')
                ->get();

            $permissions = Permission::query()->orderBy('name')->get();

            $matrix = [];

            foreach ($roles as $role) {
                $rolePermissionIds = $role->permissions->pluck('id')->all();
                foreach ($permissions as $permission) {
                    $matrix[$role->id][$permission->id] = in_array($permission->id, $rolePermissionIds);
                }
            }

            return [
                'roles' => $roles->map(fn (Role $r) => [
                    'id' => (string) $r->id,
                    'name' => $r->name,
                    'slug' => $r->slug,
                ]),
                'permissions' => $permissions->map(fn (Permission $p) => [
                    'id' => (string) $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'description' => $p->description,
                ]),
                'matrix' => $matrix,
            ];
        });
    }

    public function updateRolePermissions(int $roleId, array $permissionIds, int $tenantId): void
    {
        $role = Role::query()
            ->where('id', $roleId)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        $role->permissions()->sync($permissionIds);

        $this->clearMatrixCache($tenantId);
    }

    public function clonePermissions(int $sourceRoleId, int $targetRoleId, int $tenantId): void
    {
        $source = Role::query()
            ->where('id', $sourceRoleId)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        $target = Role::query()
            ->where('id', $targetRoleId)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        $permissionIds = $source->permissions()->pluck('permissions.id')->all();

        $target->permissions()->sync($permissionIds);

        $this->clearMatrixCache($tenantId);
    }

    public function clearMatrixCache(int $tenantId): void
    {
        Cache::forget("tenant.{$tenantId}.permission_matrix");
    }
}
