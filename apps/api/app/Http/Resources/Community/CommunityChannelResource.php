<?php

namespace App\Http\Resources\Community;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityChannelResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'category_id' => $this->category_id ? (string) $this->category_id : null,
            'slug' => $this->slug,
            'name' => $this->name,
            'description' => $this->description,
            'type' => $this->type,
            'status' => $this->status,
            'is_locked' => (bool) $this->is_locked,
            'is_pinned' => (bool) $this->is_pinned,
            'allows_questions' => (bool) $this->allows_questions,
            'sort_order' => $this->sort_order,
            'messages_count' => (int) $this->whenCounted('messages', fn ($count) => $count, 0),
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'last_message' => $this->whenLoaded('lastMessage', fn () => new CommunityMessageResource($this->lastMessage)),
            'category' => $this->whenLoaded('category', fn () => new CommunityCategoryResource($this->category)),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
