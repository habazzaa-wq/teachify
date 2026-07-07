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
            'type' => $this->type,
            'source' => $this->source,
            'provider' => $this->provider,
            'providerService' => $this->provider_service,
            'bunnyVideoId' => $this->bunny_video_id ?? $this->external_id,
            'bunnyLibraryId' => $this->bunny_library_id,
            'bunnyStoragePath' => $this->bunny_storage_path ?? $this->storage_key,
            'bunnyStreamUrl' => $this->bunny_stream_url,
            'cdnUrl' => $this->cdn_url,
            'thumbnailUrl' => $this->thumbnail_url,
            'previewUrl' => $this->preview_url,
            'mimeType' => $this->mime_type,
            'extension' => $this->extension,
            'originalName' => $this->original_name ?? $this->original_filename,
            'originalFilename' => $this->original_filename,
            'title' => $this->title,
            'description' => $this->description,
            'tags' => $this->tags ?? [],
            'size' => (int) ($this->size ?? $this->size_bytes ?? 0),
            'sizeBytes' => (int) ($this->size_bytes ?? $this->size ?? 0),
            'duration' => (float) ($this->duration ?? 0),
            'width' => $this->width,
            'height' => $this->height,
            'status' => $this->status,
            'visibility' => $this->visibility,
            'processingStatus' => $this->processing_status,
            'checksum' => $this->checksum,
            'metadata' => $this->metadata ?? [],
            'favorite' => $this->favorite_at !== null,
            'favoriteAt' => $this->favorite_at?->toISOString(),
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
        ];
    }
}
