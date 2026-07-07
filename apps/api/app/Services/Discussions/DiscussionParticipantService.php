<?php

namespace App\Services\Discussions;

use App\Models\DiscussionParticipant;
use App\Models\DiscussionPost;
use App\Models\DiscussionThread;
use App\Models\Tenant;
use App\Models\TenantUser;

class DiscussionParticipantService
{
    public function track(DiscussionThread $thread, TenantUser $member): DiscussionParticipant
    {
        return DiscussionParticipant::firstOrCreate(
            [
                'tenant_id' => $thread->tenant_id,
                'discussion_thread_id' => $thread->id,
                'tenant_user_id' => $member->id,
            ],
            [
                'last_read_post_id' => null,
                'last_read_at' => null,
            ],
        );
    }

    public function markRead(
        Tenant $tenant,
        DiscussionThread $thread,
        TenantUser $member,
        ?DiscussionPost $lastPost = null,
    ): DiscussionParticipant {
        $this->bindTenant($tenant);
        $participant = $this->track($thread, $member);

        $participant->forceFill([
            'last_read_post_id' => $lastPost?->id,
            'last_read_at' => now(),
        ])->save();

        return $participant->refresh();
    }

    public function unreadCount(Tenant $tenant, DiscussionThread $thread, TenantUser $member): int
    {
        $this->bindTenant($tenant);

        $participant = DiscussionParticipant::query()
            ->where('tenant_id', $tenant->id)
            ->where('discussion_thread_id', $thread->id)
            ->where('tenant_user_id', $member->id)
            ->first();

        if (! $participant) {
            return DiscussionPost::query()
                ->where('tenant_id', $tenant->id)
                ->where('discussion_thread_id', $thread->id)
                ->where('status', 'active')
                ->count();
        }

        if (! $participant->last_read_at) {
            return DiscussionPost::query()
                ->where('tenant_id', $tenant->id)
                ->where('discussion_thread_id', $thread->id)
                ->where('status', 'active')
                ->count();
        }

        return DiscussionPost::query()
            ->where('tenant_id', $tenant->id)
            ->where('discussion_thread_id', $thread->id)
            ->where('status', 'active')
            ->where('created_at', '>', $participant->last_read_at)
            ->count();
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
