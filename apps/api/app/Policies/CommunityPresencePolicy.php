<?php

namespace App\Policies;

use App\Models\CommunityChannel;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Community\CommunityAccessService;

class CommunityPresencePolicy
{
    public function __construct(private readonly CommunityAccessService $access) {}

    public function update(TenantUser $member, Tenant $tenant): bool
    {
        return $this->access->canAccess($member, $tenant);
    }

    public function typing(TenantUser $member, Tenant $tenant, CommunityChannel $channel): bool
    {
        return $channel->tenant_id === $tenant->id
            && $this->access->canViewChannel($member, $tenant, $channel);
    }

    public function viewOnline(TenantUser $member, Tenant $tenant): bool
    {
        return $this->access->canAccess($member, $tenant);
    }
}
