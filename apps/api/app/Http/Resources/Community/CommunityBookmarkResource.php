<?php

namespace App\Http\Resources\Community;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityBookmarkResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'note' => $this->note,
            'message' => $this->whenLoaded('message', fn () => new CommunityMessageResource($this->message)),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
