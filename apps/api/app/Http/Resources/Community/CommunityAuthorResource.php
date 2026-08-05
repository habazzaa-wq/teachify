<?php

namespace App\Http\Resources\Community;

use App\Models\TenantUser;
use App\Services\Community\CommunityAccessService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property TenantUser $resource */
class CommunityAuthorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var TenantUser|null $member */
        $member = $this->resource;

        if ($member === null) {
            return [
                'id' => null,
                'name' => null,
                'avatar' => null,
                'role' => null,
            ];
        }

        return [
            'id' => (string) $member->id,
            'name' => $member->user?->name,
            'avatar' => $member->avatar,
            'role' => app(CommunityAccessService::class)->roleFor($member, \currentTenant()),
        ];
    }
}
