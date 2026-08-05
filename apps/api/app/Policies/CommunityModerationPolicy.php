<?php

namespace App\Policies;

use App\Models\CommunityChannel;
use App\Models\CommunityReport;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Community\CommunityAccessService;

class CommunityModerationPolicy
{
    public function __construct(private readonly CommunityAccessService $access) {}

    public function moderate(TenantUser $member, Tenant $tenant): bool
    {
        return $this->access->canModerate($member, $tenant);
    }

    public function review(TenantUser $member, Tenant $tenant, ?CommunityReport $report = null): bool
    {
        if ($report !== null && $report->tenant_id !== $tenant->id) {
            return false;
        }

        return $this->moderate($member, $tenant);
    }

    public function lockChannel(TenantUser $member, Tenant $tenant, CommunityChannel $channel): bool
    {
        return $this->access->canModerateChannel($member, $tenant, $channel);
    }
}
