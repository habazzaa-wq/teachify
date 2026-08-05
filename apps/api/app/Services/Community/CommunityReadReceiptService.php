<?php

namespace App\Services\Community;

use App\Models\CommunityChannel;
use App\Models\CommunityMessage;
use App\Models\CommunityReadReceipt;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Validation\ValidationException;

class CommunityReadReceiptService
{
    public function markRead(
        Tenant $tenant,
        CommunityChannel $channel,
        TenantUser $member,
        int $lastReadMessageId,
        ?int $threadId = null,
    ): CommunityReadReceipt {
        $this->bindTenant($tenant);
        $this->ensureChannelInTenant($tenant, $channel);

        $message = CommunityMessage::query()
            ->where('tenant_id', $tenant->id)
            ->where('channel_id', $channel->id)
            ->when($threadId !== null, fn ($query) => $query->where('thread_id', $threadId))
            ->where('id', $lastReadMessageId)
            ->where('status', 'active')
            ->first();

        if ($message === null) {
            throw ValidationException::withMessages([
                'last_read_message_id' => ['The message is invalid.'],
            ]);
        }

        return CommunityReadReceipt::query()->updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'tenant_user_id' => $member->id,
                'channel_id' => $channel->id,
                'thread_id' => $threadId,
            ],
            [
                'last_read_message_id' => $message->id,
                'last_read_at' => now(),
            ],
        );
    }

    /**
     * Members (with an active receipt) who have already read a given message.
     *
     * @return array<int, array<string, mixed>>
     */
    public function seenBy(Tenant $tenant, CommunityChannel $channel, CommunityMessage $message): array
    {
        return CommunityReadReceipt::query()
            ->where('tenant_id', $tenant->id)
            ->where('channel_id', $channel->id)
            ->where('thread_id', $message->thread_id)
            ->where('last_read_message_id', '>=', $message->id)
            ->with('member.user')
            ->get()
            ->map(fn (CommunityReadReceipt $receipt) => [
                'id' => $receipt->member?->id,
                'name' => $receipt->member?->user?->name,
                'avatar' => $receipt->member?->avatar,
                'read_at' => $receipt->last_read_at?->toIso8601String(),
            ])
            ->all();
    }

    public function unreadCount(Tenant $tenant, CommunityChannel $channel, TenantUser $member, ?int $threadId = null): int
    {
        $receipt = CommunityReadReceipt::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $member->id)
            ->where('channel_id', $channel->id)
            ->where('thread_id', $threadId)
            ->first();

        $query = CommunityMessage::query()
            ->where('tenant_id', $tenant->id)
            ->where('channel_id', $channel->id)
            ->where('status', 'active')
            ->where('tenant_user_id', '!=', $member->id);

        if ($threadId !== null) {
            $query->where('thread_id', $threadId);
        }

        if ($receipt !== null && $receipt->last_read_message_id !== null) {
            $query->where('id', '>', $receipt->last_read_message_id);
        }

        return $query->count();
    }

    private function ensureChannelInTenant(Tenant $tenant, CommunityChannel $channel): void
    {
        if ($channel->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'channel' => ['The channel is invalid for this tenant.'],
            ]);
        }
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
