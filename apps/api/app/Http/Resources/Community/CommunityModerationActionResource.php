<?php

namespace App\Http\Resources\Community;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityModerationActionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'action' => $this->action,
            'reason' => $this->reason,
            'duration_minutes' => $this->duration_minutes,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'channel_id' => $this->channel_id ? (string) $this->channel_id : null,
            'message_id' => $this->message_id ? (string) $this->message_id : null,
            'moderator' => $this->whenLoaded('moderator', fn () => new CommunityAuthorResource($this->moderator)),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
