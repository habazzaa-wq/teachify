<?php

namespace App\Http\Resources\Community;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityPresenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->member?->id ? (string) $this->member->id : null,
            'name' => $this->member?->user?->name,
            'avatar' => $this->member?->avatar,
            'status' => $this->status,
            'current_channel_id' => $this->current_channel_id ? (string) $this->current_channel_id : null,
            'last_seen_at' => $this->last_seen_at?->toIso8601String(),
        ];
    }
}
