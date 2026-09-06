<?php

namespace App\Services\Media;

use App\Models\MediaAsset;
use App\Models\MediaAssetCaption;
use App\Models\MediaAssetUsage;
use App\Models\MediaAssetVariant;
use App\Models\MediaCollection;
use App\Models\MediaUploadSession;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MediaLibraryService
{
    private const ASSET_STATUSES = ['pending', 'uploading', 'processing', 'ready', 'failed', 'deleted'];
    private const ASSET_TYPES = ['video', 'image', 'document', 'pdf', 'archive', 'attachment', 'caption', 'thumbnail'];
    private const VISIBILITIES = ['private', 'public'];
    private const VARIANT_TYPES = ['thumbnail', 'preview', 'transcode', 'stream_playlist', 'download'];
    private const CAPTION_FORMATS = ['vtt', 'srt'];
    private const UPLOAD_SESSION_STATUSES = ['draft', 'uploading', 'completed', 'failed', 'expired'];

    /**
     * @param array<string, mixed> $data
     */
    public function createCollection(Tenant $tenant, array $data): MediaCollection
    {
        return MediaCollection::create([
            'tenant_id' => $tenant->id,
            'name' => $data['name'],
            'slug' => $data['slug'] ?? Str::slug($data['name']),
            'purpose' => $data['purpose'],
            'description' => $data['description'] ?? null,
            'metadata' => $data['metadata'] ?? [],
        ])->refresh();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createAsset(Tenant $tenant, array $data, ?TenantUser $creator = null): MediaAsset
    {
        $this->validateIn($data['status'] ?? 'pending', self::ASSET_STATUSES, 'status');
        $this->validateIn($data['type'], self::ASSET_TYPES, 'type');
        $this->validateIn($data['visibility'] ?? 'private', self::VISIBILITIES, 'visibility');

        if (isset($data['media_collection_id'])) {
            $this->collectionForTenant($tenant, $data['media_collection_id']);
        }

        return MediaAsset::create([
            'tenant_id' => $tenant->id,
            'media_collection_id' => $data['media_collection_id'] ?? null,
            'provider' => $data['provider'],
            'provider_service' => $data['provider_service'],
            'type' => $data['type'],
            'status' => $data['status'] ?? 'pending',
            'visibility' => $data['visibility'] ?? 'private',
            'storage_key' => $data['storage_key'] ?? null,
            'external_id' => $data['external_id'] ?? null,
            'original_filename' => $data['original_filename'] ?? null,
            'mime_type' => $data['mime_type'] ?? null,
            'size_bytes' => $data['size_bytes'] ?? null,
            'checksum' => $data['checksum'] ?? null,
            'metadata' => $data['metadata'] ?? [],
            'created_by_tenant_user_id' => $creator?->id,
        ])->refresh();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createVariant(MediaAsset $asset, array $data): MediaAssetVariant
    {
        $this->ensureAssetInCurrentTenant($asset);
        $this->validateIn($data['type'], self::VARIANT_TYPES, 'type');
        $this->validateIn($data['status'] ?? 'pending', self::ASSET_STATUSES, 'status');

        return MediaAssetVariant::create([
            'tenant_id' => $asset->tenant_id,
            'media_asset_id' => $asset->id,
            'type' => $data['type'],
            'status' => $data['status'] ?? 'pending',
            'storage_key' => $data['storage_key'] ?? null,
            'external_id' => $data['external_id'] ?? null,
            'mime_type' => $data['mime_type'] ?? null,
            'size_bytes' => $data['size_bytes'] ?? null,
            'width' => $data['width'] ?? null,
            'height' => $data['height'] ?? null,
            'duration_seconds' => $data['duration_seconds'] ?? null,
            'metadata' => $data['metadata'] ?? [],
        ])->refresh();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createCaption(MediaAsset $asset, array $data): MediaAssetCaption
    {
        $this->ensureAssetInCurrentTenant($asset);
        $this->validateIn($data['format'], self::CAPTION_FORMATS, 'format');
        $this->validateIn($data['status'] ?? 'pending', self::ASSET_STATUSES, 'status');

        return MediaAssetCaption::create([
            'tenant_id' => $asset->tenant_id,
            'media_asset_id' => $asset->id,
            'language' => $data['language'],
            'label' => $data['label'] ?? null,
            'format' => $data['format'],
            'storage_key' => $data['storage_key'] ?? null,
            'status' => $data['status'] ?? 'pending',
            'is_default' => $data['is_default'] ?? false,
            'metadata' => $data['metadata'] ?? [],
        ])->refresh();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function linkUsage(MediaAsset $asset, Model $usable, string $purpose, array $data = []): MediaAssetUsage
    {
        $this->ensureAssetInCurrentTenant($asset);

        if (! isset($usable->tenant_id) || $usable->tenant_id !== $asset->tenant_id) {
            throw ValidationException::withMessages([
                'usable' => ['The media usage target is invalid for this tenant.'],
            ]);
        }

        return MediaAssetUsage::updateOrCreate(
            [
                'tenant_id' => $asset->tenant_id,
                'media_asset_id' => $asset->id,
                'usable_type' => $usable::class,
                'usable_id' => $usable->getKey(),
                'purpose' => $purpose,
            ],
            [
                'sort_order' => $data['sort_order'] ?? 0,
                'metadata' => $data['metadata'] ?? [],
            ],
        );
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createUploadSession(Tenant $tenant, array $data, ?TenantUser $creator = null): MediaUploadSession
    {
        $this->validateIn($data['status'] ?? 'draft', self::UPLOAD_SESSION_STATUSES, 'status');

        if (isset($data['media_asset_id'])) {
            $this->assetForTenant($tenant, $data['media_asset_id']);
        }

        return MediaUploadSession::create([
            'tenant_id' => $tenant->id,
            'media_asset_id' => $data['media_asset_id'] ?? null,
            'created_by_tenant_user_id' => $creator?->id,
            'provider' => $data['provider'],
            'provider_service' => $data['provider_service'] ?? null,
            'status' => $data['status'] ?? 'draft',
            'expires_at' => $data['expires_at'] ?? null,
            'metadata' => $data['metadata'] ?? [],
        ])->refresh();
    }

    public function updateUploadSessionStatus(MediaUploadSession $session, string $status): MediaUploadSession
    {
        if (app()->bound('currentTenant') && $session->tenant_id !== currentTenant()->id) {
            throw ValidationException::withMessages([
                'session' => ['The media upload session is invalid for this tenant.'],
            ]);
        }

        $this->validateIn($status, self::UPLOAD_SESSION_STATUSES, 'status');

        $session->forceFill(['status' => $status])->save();

        return $session->refresh();
    }

    private function collectionForTenant(Tenant $tenant, int $collectionId): MediaCollection
    {
        $collection = MediaCollection::query()
            ->where('tenant_id', $tenant->id)
            ->whereKey($collectionId)
            ->first();

        if (! $collection) {
            throw ValidationException::withMessages([
                'media_collection_id' => ['The selected media collection is invalid for this tenant.'],
            ]);
        }

        return $collection;
    }

    private function assetForTenant(Tenant $tenant, int $assetId): MediaAsset
    {
        $asset = MediaAsset::query()
            ->where('tenant_id', $tenant->id)
            ->whereKey($assetId)
            ->first();

        if (! $asset) {
            throw ValidationException::withMessages([
                'media_asset_id' => ['The selected media asset is invalid for this tenant.'],
            ]);
        }

        return $asset;
    }

    private function ensureAssetInCurrentTenant(MediaAsset $asset): void
    {
        if (app()->bound('currentTenant') && $asset->tenant_id !== currentTenant()->id) {
            throw ValidationException::withMessages([
                'media_asset' => ['The media asset is invalid for this tenant.'],
            ]);
        }
    }

    /**
     * @param list<string> $allowed
     */
    private function validateIn(string $value, array $allowed, string $field): void
    {
        if (! in_array($value, $allowed, true)) {
            throw ValidationException::withMessages([
                $field => ["The selected {$field} is invalid."],
            ]);
        }
    }
}
