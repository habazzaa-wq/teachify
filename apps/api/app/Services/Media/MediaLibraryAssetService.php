<?php

namespace App\Services\Media;

use App\Models\MediaAsset;
use App\Models\MediaAssetCaption;
use App\Models\MediaAssetUsage;
use App\Models\MediaAssetVariant;
use App\Models\MediaUploadChunk;
use App\Models\MediaUploadSession;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Repositories\MediaAssetRepository;
use App\Services\Bunny\BunnyCacheService;
use App\Services\Bunny\BunnyQueueService;
use App\Services\Bunny\Events\MediaDeleted;
use App\Services\Bunny\Events\MediaDeleteFailed;
use App\Services\Bunny\Events\MediaDeleting;
use App\Services\Bunny\Exceptions\BunnyServiceException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MediaLibraryAssetService
{
    public function __construct(
        private readonly MediaAssetRepository $assets,
        private readonly MediaManager $manager,
        private readonly BunnyCacheService $cache,
        private readonly BunnyQueueService $queue,
    ) {}

    public function list(Tenant $tenant, array $params = []): LengthAwarePaginator
    {
        return $this->assets->list($tenant, $params);
    }

    public function find(Tenant $tenant, int $id): ?MediaAsset
    {
        return $this->assets->findForTenant($tenant, $id)?->load([
            'creator',
            'captions',
            'variants',
            'usages',
        ]);
    }

    public function findOrFail(Tenant $tenant, int $id): MediaAsset
    {
        return $this->assets->findOrFailForTenant($tenant, $id)->load([
            'creator',
            'captions',
            'variants',
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

    /**
     * Synchronized deletion: Bunny first, then local.
     *
     * Flow:
     *  1. Determine provider + service from asset metadata
     *  2. Dispatch MediaDeleting event
     *  3. Delete from Bunny (Storage or Stream)
     *  4. Verify Bunny deletion succeeded (exception = failure)
     *  5. Begin DB transaction
     *  6. Clean up pivot/related records
     *  7. Soft delete the asset
     *  8. Commit transaction
     *  9. Dispatch MediaDeleted event
     * 10. Invalidate caches + recalculate usage
     *
     * If Bunny fails: no local changes, throw exception.
     */
    public function softDelete(Tenant $tenant, MediaAsset $asset): void
    {
        $providerService = $this->resolveProviderService($asset);

        event(new MediaDeleting(
            $asset,
            $tenant->id,
            $asset->provider,
            $providerService,
        ));

        $this->deleteFromBunny($asset, $providerService);

        DB::transaction(function () use ($asset) {
            $this->cleanupRelatedRecords($asset);
            $asset->delete();
        });

        $this->logDeletionSuccess($asset, $tenant->id);
        $this->cache->invalidateStorage($asset->bunny_storage_path);
        $this->cache->invalidateUsage();
        $this->dispatchUsageRecalculation($tenant);

        event(new MediaDeleted(
            $tenant->id,
            $asset->bunny_storage_path ?: ($asset->bunny_video_id ?: (string) $asset->id),
            $providerService,
        ));
    }

    public function restore(Tenant $tenant, MediaAsset $asset): void
    {
        $asset->restore();
    }

    public function duplicate(Tenant $tenant, MediaAsset $asset): MediaAsset
    {
        return DB::transaction(function () use ($asset) {
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

    /**
     * Bulk delete with partial failure handling.
     *
     * Each asset is processed independently. Failures are collected
     * and returned. No asset is deleted locally if its Bunny deletion
     * fails. Failed items are queued for retry.
     *
     * @return array{deleted: int, failed: int, failures: array<int, array{asset_id: int, error: string}>}
     */
    public function bulkDelete(Tenant $tenant, array $ids): array
    {
        $assets = MediaAsset::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', $ids)
            ->get();

        $deleted = 0;
        $failures = [];

        foreach ($assets as $asset) {
            try {
                $providerService = $this->resolveProviderService($asset);

                event(new MediaDeleting(
                    $asset,
                    $tenant->id,
                    $asset->provider,
                    $providerService,
                ));

                $this->deleteFromBunny($asset, $providerService);

                DB::transaction(function () use ($asset) {
                    $this->cleanupRelatedRecords($asset);
                    $asset->delete();
                });

                $deleted++;

                $this->logDeletionSuccess($asset, $tenant->id);
                $this->cache->invalidateStorage($asset->bunny_storage_path);

                event(new MediaDeleted(
                    $tenant->id,
                    $asset->bunny_storage_path ?: ($asset->bunny_video_id ?: (string) $asset->id),
                    $providerService,
                ));
            } catch (\Throwable $e) {
                $failures[] = [
                    'asset_id' => $asset->id,
                    'error' => $e->getMessage(),
                ];

                Log::channel('bunny')->error('Bulk delete: Bunny deletion failed, skipping local delete', [
                    'asset_id' => $asset->id,
                    'tenant_id' => $tenant->id,
                    'provider' => $asset->provider,
                    'provider_service' => $asset->provider_service,
                    'storage_key' => $asset->storage_key,
                    'bunny_video_id' => $asset->bunny_video_id,
                    'error' => $e->getMessage(),
                    'code' => $e->getCode(),
                ]);

                event(new MediaDeleteFailed(
                    $asset,
                    $tenant->id,
                    $asset->provider,
                    $this->resolveProviderService($asset),
                    $e->getMessage(),
                    $e->getCode() ?: null,
                ));

                $this->queueRetryForFailedAsset($asset, $e);
            }
        }

        if ($deleted > 0) {
            try {
                $this->cache->invalidateUsage();
            } catch (\Throwable $e) {
                Log::channel('bunny')->warning('Failed to invalidate usage cache after bulk delete', [
                    'tenant_id' => $tenant->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $this->dispatchUsageRecalculation($tenant);
        }

        return [
            'deleted' => $deleted,
            'failed' => count($failures),
            'failures' => $failures,
        ];
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

        $maxBytes = $tenant->config['storage_limit_bytes'] ?? 5_368_709_120;

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
        $ext = isset($pathinfo['extension']) ? '.'.$pathinfo['extension'] : '';

        return $base.' (copy)'.$ext;
    }

    /**
     * Determine whether the asset belongs to Bunny Storage or Bunny Stream
     * from its existing metadata. Never guess.
     */
    private function resolveProviderService(MediaAsset $asset): string
    {
        if ($asset->provider_service !== null) {
            return $asset->provider_service;
        }

        if ($asset->bunny_video_id !== null || $asset->external_id !== null) {
            return 'stream';
        }

        return 'storage';
    }

    /**
     * Delete the remote object from Bunny. Throws on failure.
     *
     * If the resource is already gone (404), it is treated as successfully
     * deleted so the caller can still clean up the local database record.
     */
    private function deleteFromBunny(MediaAsset $asset, string $providerService): void
    {
        if ($asset->provider !== 'bunny') {
            return;
        }

        $start = microtime(true);

        try {
            $this->manager->providerFor($asset->provider, $providerService)
                ->deleteAsset($asset);
        } catch (\Throwable $e) {
            if ($e instanceof BunnyServiceException && $e->getCode() === 404) {
                Log::channel('bunny')->warning('Bunny resource already deleted (404), cleaning up local record', [
                    'asset_id' => $asset->id,
                    'service' => $providerService,
                    'storage_key' => $asset->bunny_storage_path ?: $asset->storage_key,
                    'video_id' => $asset->bunny_video_id ?: $asset->external_id,
                ]);

                return;
            }

            throw $e;
        }

        $duration = round((microtime(true) - $start) * 1000, 1);

        Log::channel('bunny')->info('Bunny object deleted', [
            'asset_id' => $asset->id,
            'service' => $providerService,
            'storage_key' => $asset->bunny_storage_path ?: $asset->storage_key,
            'video_id' => $asset->bunny_video_id ?: $asset->external_id,
            'library_id' => $asset->bunny_library_id,
            'duration_ms' => $duration,
        ]);
    }

    /**
     * Clean up all related database records within a transaction.
     */
    private function cleanupRelatedRecords(MediaAsset $asset): void
    {
        MediaAssetVariant::where('media_asset_id', $asset->id)->delete();
        MediaAssetCaption::where('media_asset_id', $asset->id)->delete();
        MediaAssetUsage::where('media_asset_id', $asset->id)->delete();

        $sessionIds = MediaUploadSession::where('media_asset_id', $asset->id)
            ->pluck('id');

        if ($sessionIds->isNotEmpty()) {
            MediaUploadChunk::whereIn('media_upload_session_id', $sessionIds)->delete();
            MediaUploadSession::where('media_asset_id', $asset->id)->delete();
        }
    }

    private function logDeletionSuccess(MediaAsset $asset, int $tenantId): void
    {
        Log::channel('bunny')->info('Asset deleted successfully', [
            'asset_id' => $asset->id,
            'tenant_id' => $tenantId,
            'provider' => $asset->provider,
            'provider_service' => $this->resolveProviderService($asset),
            'storage_key' => $asset->bunny_storage_path ?: $asset->storage_key,
            'video_id' => $asset->bunny_video_id ?: $asset->external_id,
            'library_id' => $asset->bunny_library_id,
            'size_bytes' => $asset->size_bytes,
            'type' => $asset->type,
        ]);
    }

    private function queueRetryForFailedAsset(MediaAsset $asset, \Throwable $error): void
    {
        $isRetryable = $error instanceof BunnyServiceException
            && in_array($error->getCode(), [429, 500, 502, 503, 504, 0], true);

        if (! $isRetryable) {
            return;
        }

        $providerService = $this->resolveProviderService($asset);

        $this->queue->dispatchDelete([
            'asset_id' => $asset->id,
            'tenant_id' => $asset->tenant_id,
            'service' => $providerService,
            'path' => $asset->bunny_storage_path ?: $asset->storage_key,
            'video_id' => $asset->bunny_video_id ?: $asset->external_id,
            'delay' => 60,
        ]);
    }

    private function dispatchUsageRecalculation(Tenant $tenant): void
    {
        try {
            $this->queue->dispatchUsageSync([
                'tenant_id' => $tenant->id,
            ]);
        } catch (\Throwable $e) {
            Log::channel('bunny')->warning('Failed to dispatch usage recalculation', [
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
