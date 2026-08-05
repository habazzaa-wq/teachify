<?php

namespace App\Http\Resources\Community;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'message_id' => $this->message_id ? (string) $this->message_id : null,
            'message' => $this->whenLoaded('message', fn () => new CommunityMessageResource($this->message)),
            'reason' => $this->reason,
            'note' => $this->note,
            'status' => $this->status,
            'reporter' => $this->whenLoaded('reporter', fn () => new CommunityAuthorResource($this->reporter)),
            'reviewer' => $this->whenLoaded('reviewer', fn () => new CommunityAuthorResource($this->reviewer)),
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
