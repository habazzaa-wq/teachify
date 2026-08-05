<?php

namespace App\Services\Community;

use App\Models\CommunityBookmark;
use App\Models\CommunityChannel;
use App\Models\CommunityFollow;
use App\Models\CommunityMessage;
use App\Models\CommunityThread;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class CommunityEngagementService
{
    public function bookmark(Tenant $tenant, CommunityMessage $message, TenantUser $member, ?string $note = null): CommunityBookmark
    {
        $this->bindTenant($tenant);
        $this->ensureMessageInTenant($tenant, $message);

        return CommunityBookmark::firstOrCreate(
            [
                'tenant_id' => $tenant->id,
                'tenant_user_id' => $member->id,
                'message_id' => $message->id,
            ],
            ['note' => $note],
        );
    }

    public function removeBookmark(Tenant $tenant, CommunityMessage $message, TenantUser $member): void
    {
        CommunityBookmark::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $member->id)
            ->where('message_id', $message->id)
            ->delete();
    }

    /**
     * @return Collection<int, CommunityBookmark>
     */
    public function bookmarks(Tenant $tenant, TenantUser $member): Collection
    {
        $this->bindTenant($tenant);

        return CommunityBookmark::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $member->id)
            ->with(['message.author.user', 'message.channel'])
            ->orderByDesc('created_at')
            ->get();
    }

    public function isBookmarked(Tenant $tenant, CommunityMessage $message, TenantUser $member): bool
    {
        return CommunityBookmark::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $member->id)
            ->where('message_id', $message->id)
            ->exists();
    }

    public function followChannel(Tenant $tenant, CommunityChannel $channel, TenantUser $member, bool $muted = false): CommunityFollow
    {
        $this->bindTenant($tenant);
        $this->ensureChannelInTenant($tenant, $channel);

        return CommunityFollow::firstOrCreate(
            [
                'tenant_id' => $tenant->id,
                'tenant_user_id' => $member->id,
                'channel_id' => $channel->id,
                'thread_id' => null,
            ],
            ['muted' => $muted],
        );
    }

    public function followThread(Tenant $tenant, CommunityThread $thread, TenantUser $member, bool $muted = false): CommunityFollow
    {
        $this->bindTenant($tenant);
        $this->ensureThreadInTenant($tenant, $thread);

        return CommunityFollow::firstOrCreate(
            [
                'tenant_id' => $tenant->id,
                'tenant_user_id' => $member->id,
                'channel_id' => $thread->channel_id,
                'thread_id' => $thread->id,
            ],
            ['muted' => $muted],
        );
    }

    public function unfollow(Tenant $tenant, TenantUser $member, ?int $channelId = null, ?int $threadId = null): void
    {
        CommunityFollow::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $member->id)
            ->when($channelId !== null, fn ($query) => $query->where('channel_id', $channelId))
            ->when($threadId !== null, fn ($query) => $query->where('thread_id', $threadId))
            ->delete();
    }

    public function setMuted(Tenant $tenant, TenantUser $member, ?int $channelId, ?int $threadId, bool $muted): CommunityFollow
    {
        $follow = CommunityFollow::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $member->id)
            ->where('channel_id', $channelId)
            ->where('thread_id', $threadId)
            ->first();

        if ($follow === null) {
            throw ValidationException::withMessages([
                'follow' => ['You are not following this item.'],
            ]);
        }

        $follow->forceFill(['muted' => $muted])->save();

        return $follow->refresh();
    }

    /**
     * @return Collection<int, CommunityFollow>
     */
    public function follows(Tenant $tenant, TenantUser $member): Collection
    {
        $this->bindTenant($tenant);

        return CommunityFollow::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $member->id)
            ->with(['channel', 'thread'])
            ->get();
    }

    private function ensureMessageInTenant(Tenant $tenant, CommunityMessage $message): void
    {
        if ($message->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'message' => ['The message is invalid for this tenant.'],
            ]);
        }
    }

    private function ensureChannelInTenant(Tenant $tenant, CommunityChannel $channel): void
    {
        if ($channel->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'channel' => ['The channel is invalid for this tenant.'],
            ]);
        }
    }

    private function ensureThreadInTenant(Tenant $tenant, CommunityThread $thread): void
    {
        if ($thread->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'thread' => ['The thread is invalid for this tenant.'],
            ]);
        }
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
