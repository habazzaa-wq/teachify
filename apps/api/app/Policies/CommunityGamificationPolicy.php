<?php

namespace App\Policies;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Community\CommunityAccessService;

class CommunityGamificationPolicy
{
    public function __construct(private readonly CommunityAccessService $access) {}

    public function viewLeaderboard(TenantUser $member, Tenant $tenant): bool
    {
        return $this->access->canAccess($member, $tenant);
    }
}
