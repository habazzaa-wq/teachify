<?php

namespace App\Repositories;

use App\Models\MediaFolder;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class MediaFolderRepository
{
    public function query(Tenant $tenant)
    {
        return MediaFolder::query()
            ->where('tenant_id', $tenant->id)
            ->with(['children']);
    }

    public function list(Tenant $tenant, ?int $parentId = null): Collection
    {
        return $this->query($tenant)
            ->where('parent_id', $parentId)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    public function tree(Tenant $tenant): Collection
    {
        return $this->query($tenant)
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    public function breadcrumbs(Tenant $tenant, int $folderId): array
    {
        $crumbs = [];
        $folder = $this->query($tenant)->find($folderId);

        if (! $folder) {
            return $crumbs;
        }

        $current = $folder;
        while ($current) {
            $crumbs[] = [
                'id' => $current->id,
                'name' => $current->name,
            ];
            $current = $current->parent;
        }

        return array_reverse($crumbs);
    }

    public function findForTenant(Tenant $tenant, int $id): ?MediaFolder
    {
        return $this->query($tenant)->find($id);
    }

    public function findOrFailForTenant(Tenant $tenant, int $id): MediaFolder
    {
        return $this->query($tenant)->findOrFail($id);
    }

    public function create(Tenant $tenant, array $data): MediaFolder
    {
        $slug = Str::slug($data['name']) . '-' . Str::random(6);

        return MediaFolder::create([
            'tenant_id' => $tenant->id,
            'parent_id' => $data['parent_id'] ?? null,
            'name' => $data['name'],
            'slug' => $slug,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);
    }

    public function update(Tenant $tenant, MediaFolder $folder, array $data): MediaFolder
    {
        $folder->forceFill($data)->save();
        return $folder->refresh();
    }

    public function delete(Tenant $tenant, MediaFolder $folder): void
    {
        foreach ($folder->children as $child) {
            $this->delete($tenant, $child);
        }
        $folder->assets()->update(['folder_id' => null]);
        $folder->delete();
    }

    public function moveAssetsTo(Tenant $tenant, MediaFolder $folder, array $assetIds): int
    {
        return $folder->assets()->whereIn('id', $assetIds)->update(['folder_id' => $folder->id]);
    }
}
