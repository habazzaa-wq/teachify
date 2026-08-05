<?php

namespace App\Policies;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Community\CommunityAccessService;

class CommunityPolicy
{
    public function __construct(private readonly CommunityAccessService $access) {}

    /**
     * Entry gate for the whole community: active membership, enabled settings
     * and no active ban. Platform super admins are always allowed.
     */
    public function view(TenantUser $member, Tenant $tenant): bool
    {
        return $this->access->canAccess($member, $tenant);
    }

    public function join(TenantUser $member, Tenant $tenant): bool
    {
        return $member->tenant_id === $tenant->id && $member->status === 'active';
    }
}
