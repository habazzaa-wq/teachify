<?php

namespace App\Http\Resources\Community;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityAttachmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'type' => $this->type,
            'file_name' => $this->file_name,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'duration_seconds' => $this->duration_seconds,
            'url' => $this->url ?? $this->mediaAsset?->cdn_url,
            'media_asset_id' => $this->media_asset_id ? (string) $this->media_asset_id : null,
            'metadata' => $this->metadata,
        ];
    }
}
