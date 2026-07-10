<?php

namespace App\Services\Media;

use App\Models\MediaFolder;
use App\Models\Tenant;
use App\Repositories\MediaFolderRepository;
use Illuminate\Database\Eloquent\Collection;

class MediaLibraryFolderService
{
    public function __construct(
        private readonly MediaFolderRepository $folders,
    ) {
    }

    public function tree(Tenant $tenant): Collection
    {
        return $this->folders->tree($tenant);
    }

    public function list(Tenant $tenant, ?int $parentId = null): Collection
    {
        return $this->folders->list($tenant, $parentId);
    }

    public function breadcrumbs(Tenant $tenant, int $folderId): array
    {
        return $this->folders->breadcrumbs($tenant, $folderId);
    }

    public function findOrFail(Tenant $tenant, int $id): MediaFolder
    {
        return $this->folders->findOrFailForTenant($tenant, $id);
    }

    public function create(Tenant $tenant, array $data): MediaFolder
    {
        return $this->folders->create($tenant, $data);
    }

    public function rename(Tenant $tenant, MediaFolder $folder, string $name): MediaFolder
    {
        return $this->folders->update($tenant, $folder, ['name' => $name]);
    }

    public function delete(Tenant $tenant, MediaFolder $folder): void
    {
        $this->folders->delete($tenant, $folder);
    }

    public function move(Tenant $tenant, MediaFolder $folder, ?int $parentId): MediaFolder
    {
        // Prevent moving a folder into one of its own descendants.
        if ($parentId !== null) {
            $descendants = $folder->allDescendantIds();
            if (in_array($parentId, $descendants, true) || $parentId === $folder->id) {
                throw new \InvalidArgumentException('Cannot move a folder into itself or its descendant.');
            }
        }

        $folder->forceFill(['parent_id' => $parentId])->save();
        $folder->refreshPath();

        return $folder->refresh();
    }
}
