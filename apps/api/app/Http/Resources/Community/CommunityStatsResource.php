<?php

namespace App\Http\Resources\Community;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityStatsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $row = $this->resource;

        return [
            'key' => $row['key'] ?? null,
            'value' => (int) ($row['value'] ?? 0),
            'payload' => $row['payload'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
        ];
    }
}
