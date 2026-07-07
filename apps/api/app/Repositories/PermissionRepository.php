<?php

namespace App\Repositories;

use App\Models\Permission;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;

class PermissionRepository
{
    public function getAll(): Collection
    {
        return Cache::remember('permissions.all', 3600, function () {
            return Permission::query()->orderBy('name')->get();
        });
    }

    public function getAllSlugs(): array
    {
        return Cache::remember('permissions.all_slugs', 3600, function () {
            return Permission::query()->pluck('slug')->all();
        });
    }

    public function getByIds(array $ids): Collection
    {
        return Permission::query()->whereIn('id', $ids)->get();
    }

    public function getBySlugs(array $slugs): Collection
    {
        return Permission::query()->whereIn('slug', $slugs)->get();
    }

    public function findById(int $id): ?Permission
    {
        return Permission::query()->find($id);
    }

    public function findBySlug(string $slug): ?Permission
    {
        return Permission::query()->where('slug', $slug)->first();
    }

    public function create(array $data): Permission
    {
        $permission = Permission::create($data);

        $this->clearCache();

        return $permission;
    }

    public function update(Permission $permission, array $data): Permission
    {
        $permission->fill(collect($data)->only($permission->getFillable())->all())->save();

        $this->clearCache();

        return $permission->refresh();
    }

    public function delete(Permission $permission): bool
    {
        $result = (bool) $permission->delete();

        $this->clearCache();

        return $result;
    }

    public function clearCache(): void
    {
        Cache::forget('permissions.all');
        Cache::forget('permissions.all_slugs');
    }
}
