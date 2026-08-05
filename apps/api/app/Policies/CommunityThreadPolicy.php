<?php

namespace App\Policies;

use App\Models\CommunityChannel;
use App\Models\CommunityThread;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Community\CommunityAccessService;

class CommunityThreadPolicy
{
    public function __construct(private readonly CommunityAccessService $access) {}

    public function view(TenantUser $member, Tenant $tenant, CommunityThread $thread): bool
    {
        if ($thread->tenant_id !== $tenant->id) {
            return false;
        }

        return $this->access->canViewChannel($member, $tenant, $thread->channel);
    }

    public function create(TenantUser $member, Tenant $tenant, CommunityChannel $channel): bool
    {
        return $this->access->canPost($member, $tenant, $channel);
    }

    public function follow(TenantUser $member, Tenant $tenant, CommunityThread $thread): bool
    {
        return $this->view($member, $tenant, $thread);
    }

    public function mute(TenantUser $member, Tenant $tenant, CommunityThread $thread): bool
    {
        return $this->view($member, $tenant, $thread);
    }
}
