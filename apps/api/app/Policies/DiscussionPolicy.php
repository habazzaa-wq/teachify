<?php

namespace App\Policies;

use App\Models\DiscussionPost;
use App\Models\DiscussionReport;
use App\Models\DiscussionThread;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Discussions\DiscussionAccessService;

class DiscussionPolicy
{
    public function __construct(private readonly DiscussionAccessService $access)
    {
    }

    public function viewThread(TenantUser $member, Tenant $tenant, DiscussionThread $thread): bool
    {
        return $this->access->canViewThread($member, $tenant, $thread);
    }

    public function createThread(TenantUser $member, Tenant $tenant): bool
    {
        return $this->isActiveMember($member, $tenant);
    }

    public function manageThread(TenantUser $member, Tenant $tenant, DiscussionThread $thread): bool
    {
        return $this->access->isModerator($member, $tenant, $thread);
    }

    public function createPost(TenantUser $member, Tenant $tenant, DiscussionThread $thread): bool
    {
        return $this->access->canPost($member, $tenant, $thread);
    }

    public function updatePost(TenantUser $member, Tenant $tenant, DiscussionPost $post): bool
    {
        if ($post->tenant_id !== $tenant->id) {
            return false;
        }

        // Students may edit only their own posts.
        return $post->tenant_user_id === $member->id;
    }

    public function viewModeratedPosts(TenantUser $member, Tenant $tenant, DiscussionThread $thread): bool
    {
        return $this->access->canViewModeratedPosts($member, $tenant, $thread);
    }

    public function moderatePost(TenantUser $member, Tenant $tenant, DiscussionPost $post): bool
    {
        if ($post->tenant_id !== $tenant->id) {
            return false;
        }

        $thread = $post->thread;

        return $thread
            ? $this->access->isModerator($member, $tenant, $thread)
            : false;
    }

    public function reportPost(TenantUser $member, Tenant $tenant, DiscussionPost $post): bool
    {
        if ($post->tenant_id !== $tenant->id) {
            return false;
        }

        return $this->isActiveMember($member, $tenant);
    }

    public function reviewReports(TenantUser $member, Tenant $tenant, ?DiscussionReport $report = null): bool
    {
        if ($report && $report->tenant_id !== $tenant->id) {
            return false;
        }

        return $this->isTenantOperator($member, $tenant);
    }

    private function isActiveMember(TenantUser $member, Tenant $tenant): bool
    {
        return $member->tenant_id === $tenant->id && $member->status === 'active';
    }

    private function isTenantOperator(TenantUser $member, Tenant $tenant): bool
    {
        // Report triage is restricted to tenant owners and admins. Assigned
        // instructors moderate discussions, but reviewing abuse reports is an
        // operator-only function per the discussion authorization rules.
        return $this->hasRole($member, $tenant, 'tenant_owner')
            || $this->hasRole($member, $tenant, 'admin');
    }

    private function hasRole(TenantUser $member, Tenant $tenant, string $role): bool
    {
        return app(\App\Services\Authorization\TenantAuthorizationService::class)
            ->hasRole($member->user, $tenant, $role);
    }
}
