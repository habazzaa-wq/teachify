<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaLibraryAssetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenantId' => (string) $this->tenant_id,
            'folderId' => $this->folder_id,
            'uploaderId' => $this->uploader_id,
            'createdById' => $this->created_by_tenant_user_id,
            'type' => $this->type,
            'slug' => $this->slug,
            'source' => $this->source,
            'provider' => $this->provider,
            'providerService' => $this->provider_service,
            'collectionId' => $this->media_collection_id,
            'bunnyVideoId' => $this->bunny_video_id ?? $this->external_id,
            'bunnyLibraryId' => $this->bunny_library_id,
            'bunnyStoragePath' => $this->bunny_storage_path ?? $this->storage_key,
            'bunnyStreamUrl' => $this->bunny_stream_url,
            'cdnUrl' => $this->cdn_url,
            'thumbnailUrl' => $this->thumbnail_url,
            'previewUrl' => $this->preview_url,
            'posterUrl' => $this->poster_url,
            'mimeType' => $this->mime_type,
            'extension' => $this->extension,
            'originalName' => $this->original_name ?? $this->original_filename,
            'originalFilename' => $this->original_filename,
            'title' => $this->title,
            'description' => $this->description,
            'language' => $this->language,
            'tags' => $this->tags ?? [],
            'size' => (int) ($this->size ?? $this->size_bytes ?? 0),
            'sizeBytes' => (int) ($this->size_bytes ?? $this->size ?? 0),
            'duration' => (float) ($this->duration ?? 0),
            'width' => $this->width,
            'height' => $this->height,
            'status' => $this->status,
            'visibility' => $this->visibility,
            'processingStatus' => $this->processing_status,
            'transcodingStatus' => $this->transcoding_status,
            'isProcessing' => (bool) ($this->processing_status !== null && $this->processing_status !== 'ready' && $this->processing_status !== 'failed'),
            'processingProgress' => (int) ($this->processing_progress ?? 0),
            'captions' => $this->whenLoaded('captions', fn () => $this->captions->map(fn ($c) => [
                'id' => $c->id,
                'language' => $c->language,
                'label' => $c->label,
                'url' => $c->url,
            ])),
            'qualities' => $this->whenLoaded('qualities', fn () => $this->qualities->map(fn ($q) => [
                'label' => $q->label,
                'width' => $q->width,
                'height' => $q->height,
                'url' => $q->url,
            ])),
            'checksum' => $this->checksum,
            'metadata' => $this->metadata ?? [],
            'favorite' => $this->favorite_at !== null,
            'favoriteAt' => $this->favorite_at?->toISOString(),
            'pinned' => $this->pinned_at !== null,
            'pinnedAt' => $this->pinned_at?->toISOString(),
            'archivedAt' => $this->archived_at?->toISOString(),
            'deletedAt' => $this->deleted_at?->toISOString(),
            'createdAt' => $this->created_at->toISOString(),
            'updatedAt' => $this->updated_at->toISOString(),
            'folder' => $this->whenLoaded('folder', fn () => [
                'id' => $this->folder->id,
                'name' => $this->folder->name,
                'path' => $this->folder->path,
            ]),
            'uploader' => $this->whenLoaded('uploader', fn () => [
                'id' => $this->uploader->id,
                'name' => $this->uploader->user?->name ?? 'Unknown',
                'avatar' => $this->uploader->avatar,
            ]),
            'createdBy' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'name' => $this->creator->user?->name ?? 'Unknown',
                'avatar' => $this->creator->avatar,
            ]),
            'usages' => $this->whenLoaded('usages', fn () => $this->usages->map(fn ($u) => [
                'id' => $u->id,
                'entityType' => $u->entity_type,
                'entityId' => $u->entity_id,
                'entityTitle' => $u->entity_title,
                'context' => $u->context,
                'url' => $u->url,
            ])),
        ];
    }
}
