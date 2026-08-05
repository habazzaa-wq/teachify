<?php

namespace App\Services\Community;

use App\Models\CommunityChannel;
use App\Models\CommunityParticipant;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Authorization\TenantAuthorizationService;
use Illuminate\Validation\ValidationException;

class CommunityAccessService
{
    public const ROLE_MEMBER = 'member';

    public const ROLE_MODERATOR = 'moderator';

    public const ROLE_ADMIN = 'admin';

    public const ROLE_SUPER_ADMIN = 'super_admin';

    public function __construct(
        private readonly TenantAuthorizationService $authorization,
        private readonly CommunitySettingService $settings,
    ) {}

    /**
     * Resolve the community role for a member. Platform super admins always
     * get full access; tenant owners and admins get the admin role; instructors
     * get the moderator role; every other active member gets the member role.
     */
    public function roleFor(TenantUser $member, Tenant $tenant): string
    {
        if ($member->user->isPlatformSuperAdmin()) {
            return self::ROLE_SUPER_ADMIN;
        }

        if ($this->hasRole($member, $tenant, 'tenant_owner')
            || $this->hasRole($member, $tenant, 'admin')) {
            return self::ROLE_ADMIN;
        }

        if ($this->hasRole($member, $tenant, 'instructor')) {
            return self::ROLE_MODERATOR;
        }

        return self::ROLE_MEMBER;
    }

    public function isSuperAdmin(TenantUser $member): bool
    {
        return $member->user->isPlatformSuperAdmin();
    }

    public function isAdmin(TenantUser $member, Tenant $tenant): bool
    {
        return in_array($this->roleFor($member, $tenant), [
            self::ROLE_ADMIN,
            self::ROLE_SUPER_ADMIN,
        ], true);
    }

    public function isModerator(TenantUser $member, Tenant $tenant): bool
    {
        return in_array($this->roleFor($member, $tenant), [
            self::ROLE_MODERATOR,
            self::ROLE_ADMIN,
            self::ROLE_SUPER_ADMIN,
        ], true);
    }

    public function canAccess(TenantUser $member, Tenant $tenant): bool
    {
        if ($this->isSuperAdmin($member)) {
            return true;
        }

        if (! $this->authorization->hasActiveMembership($member->user, $tenant)) {
            return false;
        }

        if (! $this->settings->isEnabled($tenant)) {
            return false;
        }

        $participant = $this->participantFor($tenant, $member);

        return $participant === null || ! $participant->isBanned();
    }

    public function canViewChannel(TenantUser $member, Tenant $tenant, CommunityChannel $channel): bool
    {
        if ($channel->tenant_id !== $tenant->id) {
            return false;
        }

        if (! $this->canAccess($member, $tenant)) {
            return false;
        }

        if ($this->isModerator($member, $tenant)) {
            return true;
        }

        if ($channel->status !== 'active' || $channel->trashed()) {
            return false;
        }

        if ($channel->is_locked) {
            return false;
        }

        return $channel->moderatorOnly() === false;
    }

    public function canPost(TenantUser $member, Tenant $tenant, CommunityChannel $channel): bool
    {
        if (! $this->canViewChannel($member, $tenant, $channel)) {
            return false;
        }

        $participant = $this->participantFor($tenant, $member);

        if ($participant !== null && $participant->isMuted()) {
            return false;
        }

        return true;
    }

    /**
     * Fetch the membership record for a member (null for platform admins).
     */
    public function participantFor(Tenant $tenant, TenantUser $member): ?CommunityParticipant
    {
        if ($member->user->isPlatformSuperAdmin()) {
            return null;
        }

        return CommunityParticipant::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $member->id)
            ->first();
    }

    public function canModerate(TenantUser $member, Tenant $tenant): bool
    {
        return $this->canAccess($member, $tenant)
            && $this->isModerator($member, $tenant);
    }

    public function canModerateChannel(TenantUser $member, Tenant $tenant, CommunityChannel $channel): bool
    {
        return $channel->tenant_id === $tenant->id
            && $this->canModerate($member, $tenant);
    }

    /**
     * @throws ValidationException
     */
    public function ensureCanPost(TenantUser $member, Tenant $tenant, CommunityChannel $channel): void
    {
        if (! $this->canPost($member, $tenant, $channel)) {
            throw ValidationException::withMessages([
                'channel' => ['You are not allowed to post in this channel.'],
            ]);
        }
    }

    /**
     * @throws ValidationException
     */
    public function ensureCanModerate(TenantUser $member, Tenant $tenant): void
    {
        if (! $this->canModerate($member, $tenant)) {
            throw ValidationException::withMessages([
                'community' => ['Moderation privileges are required for this action.'],
            ]);
        }
    }

    private function hasRole(TenantUser $member, Tenant $tenant, string $roleSlug): bool
    {
        return $this->authorization->hasRole($member->user, $tenant, $roleSlug);
    }
}
