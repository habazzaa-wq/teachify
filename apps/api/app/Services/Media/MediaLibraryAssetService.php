<?php

namespace App\Services\Media;

use App\Models\MediaAsset;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Repositories\MediaAssetRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MediaLibraryAssetService
{
    public function __construct(
        private readonly MediaAssetRepository $assets,
        private readonly MediaManager $manager,
    ) {
    }

    public function list(Tenant $tenant, array $params = []): LengthAwarePaginator
    {
        return $this->assets->list($tenant, $params);
    }

    public function find(Tenant $tenant, int $id): ?MediaAsset
    {
        return $this->assets->findForTenant($tenant, $id)?->load([
            'creator',
            'captions',
            'qualities',
            'usages',
        ]);
    }

    public function findOrFail(Tenant $tenant, int $id): MediaAsset
    {
        return $this->assets->findOrFailForTenant($tenant, $id)->load([
            'creator',
            'captions',
            'qualities',
            'usages',
        ]);
    }

    public function create(Tenant $tenant, TenantUser $uploader, array $data): MediaAsset
    {
        $asset = MediaAsset::create([
            'tenant_id' => $tenant->id,
            'uploader_id' => $uploader->id,
            'folder_id' => $data['folder_id'] ?? null,
            'type' => $data['type'] ?? 'file',
            'source' => $data['source'] ?? 'upload',
            'provider' => $data['provider'] ?? 'local',
            'provider_service' => $data['provider_service'] ?? null,
            'status' => $data['status'] ?? 'uploading',
            'processing_status' => $data['processing_status'] ?? 'uploading',
            'visibility' => $data['visibility'] ?? 'private',
            'storage_key' => $data['storage_key'] ?? null,
            'external_id' => $data['external_id'] ?? null,
            'bunny_video_id' => $data['bunny_video_id'] ?? null,
            'bunny_library_id' => $data['bunny_library_id'] ?? null,
            'bunny_storage_path' => $data['bunny_storage_path'] ?? null,
            'bunny_stream_url' => $data['bunny_stream_url'] ?? null,
            'cdn_url' => $data['cdn_url'] ?? null,
            'thumbnail_url' => $data['thumbnail_url'] ?? null,
            'preview_url' => $data['preview_url'] ?? null,
            'original_filename' => $data['original_filename'] ?? null,
            'original_name' => $data['original_name'] ?? $data['original_filename'],
            'title' => $data['title'] ?? null,
            'description' => $data['description'] ?? null,
            'tags' => $data['tags'] ?? [],
            'mime_type' => $data['mime_type'] ?? null,
            'extension' => $data['extension'] ?? null,
            'size_bytes' => $data['size_bytes'] ?? 0,
            'size' => $data['size'] ?? $data['size_bytes'] ?? 0,
            'duration' => $data['duration'] ?? null,
            'width' => $data['width'] ?? null,
            'height' => $data['height'] ?? null,
            'checksum' => $data['checksum'] ?? null,
            'metadata' => $data['metadata'] ?? [],
        ]);

        return $asset->refresh()->load(['folder', 'uploader']);
    }

    public function update(Tenant $tenant, MediaAsset $asset, array $data): MediaAsset
    {
        $fillable = [
            'title', 'description', 'tags', 'visibility', 'folder_id',
            'thumbnail_url', 'preview_url', 'cdn_url',
        ];

        $updates = [];
        foreach ($fillable as $field) {
            if (array_key_exists($field, $data)) {
                $updates[$field] = $data[$field];
            }
        }

        if (! empty($updates)) {
            $asset->forceFill($updates)->save();
        }

        return $asset->refresh()->load(['folder', 'uploader']);
    }

    public function softDelete(Tenant $tenant, MediaAsset $asset): void
    {
        $asset->delete();
    }

    public function restore(Tenant $tenant, MediaAsset $asset): void
    {
        $asset->restore();
    }

    public function duplicate(Tenant $tenant, MediaAsset $asset): MediaAsset
    {
        return DB::transaction(function () use ($tenant, $asset) {
            $copy = $asset->replicate();
            $copy->original_filename = $this->duplicateName($asset->original_filename ?? 'untitled');
            $copy->original_name = $copy->original_filename;
            $copy->title = $asset->title ? $this->duplicateName($asset->title) : null;
            $copy->created_at = now();
            $copy->updated_at = now();
            $copy->favorite_at = null;
            $copy->archived_at = null;
            $copy->pinned_at = null;
            $copy->save();

            return $copy->refresh()->load(['folder', 'uploader']);
        });
    }

    public function rename(Tenant $tenant, MediaAsset $asset, string $title): MediaAsset
    {
        $asset->forceFill(['title' => $title])->save();
        return $asset->refresh();
    }

    public function move(Tenant $tenant, MediaAsset $asset, ?int $folderId): MediaAsset
    {
        $asset->forceFill(['folder_id' => $folderId])->save();
        return $asset->refresh()->load('folder');
    }

    public function toggleFavorite(Tenant $tenant, MediaAsset $asset): MediaAsset
    {
        $asset->forceFill([
            'favorite_at' => $asset->favorite_at ? null : now(),
        ])->save();

        return $asset->refresh();
    }

    public function togglePin(Tenant $tenant, MediaAsset $asset): MediaAsset
    {
        $asset->forceFill([
            'pinned_at' => $asset->pinned_at ? null : now(),
        ])->save();

        return $asset->refresh();
    }

    public function archive(Tenant $tenant, MediaAsset $asset): MediaAsset
    {
        $asset->forceFill(['archived_at' => now()])->save();
        return $asset->refresh();
    }

    public function bulkDelete(Tenant $tenant, array $ids): int
    {
        return MediaAsset::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', $ids)
            ->delete();
    }

    public function bulkRestore(Tenant $tenant, array $ids): int
    {
        return MediaAsset::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', $ids)
            ->onlyTrashed()
            ->restore();
    }

    public function bulkMove(Tenant $tenant, array $ids, ?int $folderId): int
    {
        return MediaAsset::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', $ids)
            ->update(['folder_id' => $folderId]);
    }

    public function bulkTag(Tenant $tenant, array $ids, array $tags): int
    {
        $count = 0;
        $assets = MediaAsset::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', $ids)
            ->get();

        foreach ($assets as $asset) {
            $existing = $asset->tags ?? [];
            $merged = array_values(array_unique(array_merge($existing, $tags)));
            $asset->forceFill(['tags' => $merged])->save();
            $count++;
        }

        return $count;
    }

    public function metrics(Tenant $tenant): array
    {
        return $this->assets->metrics($tenant);
    }

    public function recent(Tenant $tenant, int $limit = 10): Collection
    {
        return MediaAsset::query()
            ->where('tenant_id', $tenant->id)
            ->whereNull('archived_at')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function storageUsage(Tenant $tenant): array
    {
        $totalBytes = MediaAsset::query()
            ->where('tenant_id', $tenant->id)
            ->sum('size_bytes');

        $maxBytes = $tenant->config['storage_limit_bytes'] ?? 5_368_709_120; // 5GB default

        return [
            'used' => (int) $totalBytes,
            'remaining' => max(0, (int) $maxBytes - (int) $totalBytes),
            'total' => (int) $maxBytes,
            'usage_percent' => $maxBytes > 0 ? round(($totalBytes / $maxBytes) * 100, 2) : 0,
        ];
    }

    private function duplicateName(string $name): string
    {
        $pathinfo = pathinfo($name);
        $base = $pathinfo['filename'] ?? $name;
        $ext = isset($pathinfo['extension']) ? '.' . $pathinfo['extension'] : '';

        return $base . ' (copy)' . $ext;
    }
}
