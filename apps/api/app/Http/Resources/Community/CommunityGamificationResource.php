<?php

namespace App\Http\Resources\Community;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityGamificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $row = (array) $this->resource;

        return [
            'rank' => (int) ($row['rank'] ?? 0),
            'member_id' => isset($row['member_id'])
                ? (string) $row['member_id']
                : (isset($row['tenant_user_id']) ? (string) $row['tenant_user_id'] : null),
            'name' => $row['name'] ?? null,
            'avatar' => $row['avatar'] ?? null,
            'total_xp' => (int) ($row['total_xp'] ?? 0),
            'actions' => (int) ($row['actions'] ?? 0),
            'last_action_at' => $row['last_action_at'] ?? null,
        ];
    }
}
