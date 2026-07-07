<?php

namespace App\Services\Discussions;

use App\Models\DiscussionThread;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Access\AccessEvaluationService;
use App\Services\Authorization\TenantAuthorizationService;

class DiscussionAccessService
{
    public function __construct(
        private readonly AccessEvaluationService $access,
        private readonly TenantAuthorizationService $authorization,
    ) {
    }

    /**
     * Whether a member can view a thread and its non-moderated posts.
     */
    public function canViewThread(TenantUser $member, Tenant $tenant, DiscussionThread $thread): bool
    {
        if ($thread->tenant_id !== $tenant->id) {
            return false;
        }

        if ($this->isModerator($member, $tenant, $thread)) {
            return true;
        }

        return match ($thread->type) {
            'course' => $thread->course_id !== null
                && $this->access->canViewCourse($member->user, $thread->course),
            'lesson' => $thread->course_lesson_id !== null
                && $this->access->canAccessLesson($member->user, $thread->lesson),
            default => true,
        };
    }

    /**
     * Whether a member may create a new post in the thread.
     */
    public function canPost(TenantUser $member, Tenant $tenant, DiscussionThread $thread): bool
    {
        if (! $this->canViewThread($member, $tenant, $thread)) {
            return false;
        }

        if ($thread->status === 'archived') {
            return false;
        }

        if ($thread->is_locked) {
            return $this->isModerator($member, $tenant, $thread);
        }

        return true;
    }

    /**
     * Whether a member can see hidden or soft-deleted posts.
     */
    public function canViewModeratedPosts(TenantUser $member, Tenant $tenant, DiscussionThread $thread): bool
    {
        if ($thread->tenant_id !== $tenant->id) {
            return false;
        }

        return $this->isModerator($member, $tenant, $thread);
    }

    public function isModerator(TenantUser $member, Tenant $tenant, DiscussionThread $thread): bool
    {
        if ($thread->tenant_id !== $tenant->id) {
            return false;
        }

        if ($this->authorization->hasRole($member->user, $tenant, 'tenant_owner')
            || $this->authorization->hasRole($member->user, $tenant, 'admin')) {
            return true;
        }

        return $this->isAssignedInstructor($member, $tenant, $thread);
    }

    private function isAssignedInstructor(TenantUser $member, Tenant $tenant, DiscussionThread $thread): bool
    {
        if (! $this->authorization->hasRole($member->user, $tenant, 'instructor')) {
            return false;
        }

        if ($thread->course_id === null) {
            return false;
        }

        $course = $thread->course;

        return $course->created_by_tenant_user_id === $member->id
            || $course->primary_instructor_tenant_user_id === $member->id
            || $course->instructors()->where('tenant_user_id', $member->id)->exists();
    }
}
