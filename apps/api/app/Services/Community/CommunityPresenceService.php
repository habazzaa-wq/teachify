<?php

namespace App\Services\Community;

use App\Events\Community\CommunityPresenceUpdated;
use App\Events\Community\CommunityTypingStarted;
use App\Models\CommunityChannel;
use App\Models\CommunityPresence;
use App\Models\CommunityStat;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Database\Eloquent\Collection;

class CommunityPresenceService
{
    public function __construct(
        private readonly CommunityStatsService $stats,
        private readonly CommunityParticipantService $participants,
    ) {}

    public function online(Tenant $tenant, TenantUser $member, ?int $channelId = null): CommunityPresence
    {
        $this->bindTenant($tenant);

        $presence = CommunityPresence::query()->updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'tenant_user_id' => $member->id,
            ],
            [
                'status' => 'online',
                'current_channel_id' => $channelId,
                'last_seen_at' => now(),
            ],
        );

        $this->stats->set($tenant, CommunityStat::ONLINE_MEMBERS, $this->onlineCount($tenant));

        CommunityPresenceUpdated::dispatch(
            $this->userPayload($member),
            'online',
            $tenant->id,
            $channelId,
        );

        return $presence;
    }

    public function offline(Tenant $tenant, TenantUser $member): CommunityPresence
    {
        $this->bindTenant($tenant);

        $presence = CommunityPresence::query()->updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'tenant_user_id' => $member->id,
            ],
            [
                'status' => 'offline',
                'current_channel_id' => null,
                'last_seen_at' => now(),
            ],
        );

        $this->stats->set($tenant, CommunityStat::ONLINE_MEMBERS, $this->onlineCount($tenant));

        CommunityPresenceUpdated::dispatch(
            $this->userPayload($member),
            'offline',
            $tenant->id,
        );

        return $presence;
    }

    public function isOnline(Tenant $tenant, TenantUser $member): bool
    {
        return CommunityPresence::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $member->id)
            ->where('status', 'online')
            ->where('last_seen_at', '>=', now()->subMinutes(5))
            ->exists();
    }

    public function onlineCount(Tenant $tenant, ?int $channelId = null): int
    {
        return CommunityPresence::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'online')
            ->where('last_seen_at', '>=', now()->subMinutes(5))
            ->when($channelId !== null, fn ($query) => $query->where('current_channel_id', $channelId))
            ->count();
    }

    /**
     * @return Collection<int, CommunityPresence>
     */
    public function onlineMembers(Tenant $tenant, ?int $channelId = null, int $limit = 50): Collection
    {
        $this->bindTenant($tenant);

        return CommunityPresence::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'online')
            ->where('last_seen_at', '>=', now()->subMinutes(5))
            ->when($channelId !== null, fn ($query) => $query->where('current_channel_id', $channelId))
            ->with('member.user')
            ->orderByDesc('last_seen_at')
            ->limit($limit)
            ->get();
    }

    public function typing(Tenant $tenant, TenantUser $member, CommunityChannel $channel, ?int $threadId = null): void
    {
        CommunityTypingStarted::dispatch(
            $this->userPayload($member),
            $tenant->id,
            $channel->id,
            $threadId,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(TenantUser $member): array
    {
        return [
            'id' => $member->id,
            'name' => $member->user?->name,
            'avatar' => $member->avatar,
        ];
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
