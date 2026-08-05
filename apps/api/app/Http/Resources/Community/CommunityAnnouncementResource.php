<?php

namespace App\Http\Resources\Community;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityAnnouncementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'channel_id' => (string) $this->channel_id,
            'title' => $this->title,
            'body' => $this->body,
            'scheduled_at' => $this->scheduled_at?->toIso8601String(),
            'published_at' => $this->published_at?->toIso8601String(),
            'status' => $this->status,
            'metadata' => $this->metadata,
            'channel' => $this->whenLoaded('channel', fn () => new CommunityChannelResource($this->channel)),
            'creator' => $this->whenLoaded('creator', fn () => new CommunityAuthorResource($this->creator)),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
