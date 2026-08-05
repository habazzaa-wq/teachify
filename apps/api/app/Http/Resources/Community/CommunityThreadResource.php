<?php

namespace App\Http\Resources\Community;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityThreadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'channel_id' => (string) $this->channel_id,
            'title' => $this->title,
            'status' => $this->status,
            'is_pinned' => (bool) $this->is_pinned,
            'is_locked' => (bool) $this->is_locked,
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'creator' => $this->whenLoaded('creator', fn () => new CommunityAuthorResource($this->creator)),
            'channel' => $this->whenLoaded('channel', fn () => new CommunityChannelResource($this->channel)),
            'messages_count' => (int) $this->whenCounted('messages', fn ($count) => $count, 0),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
