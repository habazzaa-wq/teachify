<?php

namespace App\Policies;

use App\Models\CommunityAnnouncement;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Community\CommunityAccessService;

class CommunityAnnouncementPolicy
{
    public function __construct(private readonly CommunityAccessService $access) {}

    public function view(TenantUser $member, Tenant $tenant, ?CommunityAnnouncement $announcement = null): bool
    {
        if ($announcement !== null && $announcement->tenant_id !== $tenant->id) {
            return false;
        }

        if ($announcement !== null && $announcement->status !== 'published') {
            return $this->manage($member, $tenant);
        }

        return $this->access->canAccess($member, $tenant);
    }

    public function manage(TenantUser $member, Tenant $tenant): bool
    {
        return $this->access->canModerate($member, $tenant);
    }
}
