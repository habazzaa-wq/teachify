<?php

namespace App\Policies;

use App\Models\CommunityChannel;
use App\Models\CommunityMessage;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Community\CommunityAccessService;

class CommunityMessagePolicy
{
    public function __construct(private readonly CommunityAccessService $access) {}

    public function view(TenantUser $member, Tenant $tenant, CommunityMessage $message): bool
    {
        if ($message->tenant_id !== $tenant->id) {
            return false;
        }

        return $this->access->canViewChannel($member, $tenant, $message->channel);
    }

    public function create(TenantUser $member, Tenant $tenant, CommunityChannel $channel): bool
    {
        return $this->access->canPost($member, $tenant, $channel);
    }

    public function update(TenantUser $member, Tenant $tenant, CommunityMessage $message): bool
    {
        return $this->view($member, $tenant, $message)
            && ($message->tenant_user_id === $member->id || $this->access->isModerator($member, $tenant));
    }

    public function delete(TenantUser $member, Tenant $tenant, CommunityMessage $message): bool
    {
        return $this->view($member, $tenant, $message)
            && ($message->tenant_user_id === $member->id || $this->access->isModerator($member, $tenant));
    }

    public function moderate(TenantUser $member, Tenant $tenant, CommunityMessage $message): bool
    {
        return $this->view($member, $tenant, $message)
            && $this->access->isModerator($member, $tenant);
    }

    public function react(TenantUser $member, Tenant $tenant, CommunityMessage $message): bool
    {
        return $this->view($member, $tenant, $message);
    }

    public function bookmark(TenantUser $member, Tenant $tenant, CommunityMessage $message): bool
    {
        return $this->view($member, $tenant, $message);
    }

    public function report(TenantUser $member, Tenant $tenant, CommunityMessage $message): bool
    {
        if ($message->tenant_id !== $tenant->id || $message->tenant_user_id === $member->id) {
            return false;
        }

        return $this->access->canAccess($member, $tenant);
    }

    public function resolve(TenantUser $member, Tenant $tenant, CommunityMessage $message): bool
    {
        if (! $this->view($member, $tenant, $message)) {
            return false;
        }

        return $message->tenant_user_id === $member->id || $this->access->isModerator($member, $tenant);
    }

    public function accept(TenantUser $member, Tenant $tenant, CommunityMessage $answer): bool
    {
        if ($answer->tenant_id !== $tenant->id || $answer->parent_message_id === null) {
            return false;
        }

        return $this->view($member, $tenant, $answer)
            && ($answer->parent?->tenant_user_id === $member->id || $this->access->isModerator($member, $tenant));
    }
}
