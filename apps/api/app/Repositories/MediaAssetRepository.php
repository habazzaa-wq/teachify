<?php

namespace App\Repositories;

use App\Models\MediaAsset;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class MediaAssetRepository
{
    public function query(Tenant $tenant): Builder
    {
        return MediaAsset::query()
            ->where('tenant_id', $tenant->id)
            ->with(['folder', 'uploader']);
    }

    public function list(
        Tenant $tenant,
        array $params = [],
    ): LengthAwarePaginator {
        $query = $this->query($tenant);

        if (! empty($params['folder_id'])) {
            $query->where('folder_id', $params['folder_id']);
        } elseif (! empty($params['root']) && $params['root'] === true) {
            $query->whereNull('folder_id');
        }

        if (! empty($params['search'])) {
            $search = $params['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('original_filename', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (! empty($params['type']) && $params['type'] !== 'all') {
            $query->where('type', $params['type']);
        }

        if (! empty($params['types']) && is_array($params['types'])) {
            $query->whereIn('type', $params['types']);
        }

        if (! empty($params['status']) && $params['status'] !== 'all') {
            if ($params['status'] === 'archived') {
                $query->whereNotNull('archived_at');
            } else {
                $query->where('status', $params['status']);
            }
        }

        if (! empty($params['visibility']) && $params['visibility'] !== 'all') {
            $query->where('visibility', $params['visibility']);
        }

        if (! empty($params['processing_status']) && $params['processing_status'] !== 'all') {
            $query->where('processing_status', $params['processing_status']);
        }

        if (! empty($params['favorites'])) {
            $query->whereNotNull('favorite_at');
        }

        if (! empty($params['archived'])) {
            $query->whereNotNull('archived_at');
        } elseif (! isset($params['archived']) && empty($params['status'])) {
            $query->whereNull('archived_at');
        }

        if (! empty($params['extension'])) {
            $query->where('extension', $params['extension']);
        }

        if (! empty($params['date_from'])) {
            $query->whereDate('created_at', '>=', $params['date_from']);
        }

        if (! empty($params['date_to'])) {
            $query->whereDate('created_at', '<=', $params['date_to']);
        }

        if (! empty($params['uploader_id'])) {
            $query->where('uploader_id', $params['uploader_id']);
        }

        if (! empty($params['tags']) && is_array($params['tags'])) {
            foreach ($params['tags'] as $tag) {
                $query->whereJsonContains('tags', $tag);
            }
        }

        $sortField = $params['sort'] ?? 'created_at';
        $sortDir = $params['sort_dir'] ?? 'desc';

        $allowedSorts = ['created_at', 'updated_at', 'original_filename', 'title', 'size_bytes', 'type', 'duration', 'favorite_at'];
        if (! in_array($sortField, $allowedSorts, true)) {
            $sortField = 'created_at';
        }

        $query->orderBy($sortField, $sortDir === 'asc' ? 'asc' : 'desc');

        $perPage = min((int) ($params['per_page'] ?? 48), 100);

        return $query->paginate($perPage);
    }

    public function findForTenant(Tenant $tenant, int $id): ?MediaAsset
    {
        return $this->query($tenant)->find($id);
    }

    public function findOrFailForTenant(Tenant $tenant, int $id): MediaAsset
    {
        return $this->query($tenant)->findOrFail($id);
    }

    public function metrics(Tenant $tenant): array
    {
        $query = MediaAsset::query()->where('tenant_id', $tenant->id);

        $total = (clone $query)->count();
        $totalSize = (clone $query)->sum('size_bytes');
        $videos = (clone $query)->where('type', 'video')->count();
        $images = (clone $query)->where('type', 'image')->count();
        $documents = (clone $query)->whereIn('type', ['document', 'pdf'])->count();
        $audio = (clone $query)->where('type', 'audio')->count();
        $archived = (clone $query)->whereNotNull('archived_at')->count();
        $processing = (clone $query)->where('processing_status', 'processing')->count();
        $favorites = (clone $query)->whereNotNull('favorite_at')->count();
        $recentCount = (clone $query)->where('created_at', '>=', now()->subDays(7))->count();

        return [
            'total_assets' => $total,
            'total_size' => $totalSize,
            'videos' => $videos,
            'images' => $images,
            'documents' => $documents,
            'audio' => $audio,
            'archived' => $archived,
            'processing' => $processing,
            'favorites' => $favorites,
            'recent_uploads' => $recentCount,
        ];
    }

    public function findByIds(Tenant $tenant, array $ids): \Illuminate\Database\Eloquent\Collection
    {
        return $this->query($tenant)->whereIn('id', $ids)->get();
    }
}
