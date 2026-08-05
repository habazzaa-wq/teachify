<?php

namespace App\Policies;

use App\Models\CommunityChannel;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Community\CommunityAccessService;

class CommunityChannelPolicy
{
    public function __construct(private readonly CommunityAccessService $access) {}

    public function view(TenantUser $member, Tenant $tenant, CommunityChannel $channel): bool
    {
        return $channel->tenant_id === $tenant->id
            && $this->access->canViewChannel($member, $tenant, $channel);
    }

    public function viewMessages(TenantUser $member, Tenant $tenant, CommunityChannel $channel): bool
    {
        return $this->view($member, $tenant, $channel);
    }

    public function manage(TenantUser $member, Tenant $tenant, CommunityChannel $channel): bool
    {
        return $this->access->canModerateChannel($member, $tenant, $channel);
    }
}
