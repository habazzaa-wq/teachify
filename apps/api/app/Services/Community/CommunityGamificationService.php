<?php

namespace App\Services\Community;

use App\Models\CommunityXpEvent;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CommunityGamificationService
{
    public const XP_MESSAGE_CREATED = 5;

    public const XP_MESSAGE_REPLY = 3;

    public const XP_REACTION_RECEIVED = 2;

    public const XP_MENTIONED = 1;

    public const XP_THREAD_CREATED = 10;

    public const XP_ACCEPTED_ANSWER = 25;

    public const XP_SOLVED = 10;

    public const XP_DAILY_LOGIN = 5;

    public function __construct(
        private readonly CommunitySettingService $settings,
    ) {}

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function award(
        Tenant $tenant,
        TenantUser $member,
        string $actionType,
        int $xp,
        ?int $messageId = null,
        array $metadata = [],
    ): ?CommunityXpEvent {
        if (! $this->settings->forTenant($tenant)->xp_enabled || $xp <= 0) {
            return null;
        }

        $this->bindTenant($tenant);

        return CommunityXpEvent::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $member->id,
            'action_type' => $actionType,
            'xp' => $xp,
            'message_id' => $messageId,
            'metadata' => $metadata,
        ])->refresh();
    }

    public function totalXp(Tenant $tenant, TenantUser $member): int
    {
        return (int) CommunityXpEvent::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $member->id)
            ->sum('xp');
    }

    public function todayXp(Tenant $tenant, TenantUser $member): int
    {
        return (int) CommunityXpEvent::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $member->id)
            ->where('created_at', '>=', now()->startOfDay())
            ->sum('xp');
    }

    public function rankFor(int $xp): string
    {
        return match (true) {
            $xp >= 1000 => 'top_contributor',
            $xp >= 600 => 'star_member',
            $xp >= 300 => 'contributor',
            $xp >= 100 => 'active_member',
            default => 'beginner',
        };
    }

    /**
     * Award the daily login bonus exactly once per day.
     */
    public function awardDailyLogin(Tenant $tenant, TenantUser $member): ?CommunityXpEvent
    {
        $already = CommunityXpEvent::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $member->id)
            ->where('action_type', 'daily_login')
            ->where('created_at', '>=', now()->startOfDay())
            ->exists();

        if ($already) {
            return null;
        }

        return $this->award($tenant, $member, 'daily_login', self::XP_DAILY_LOGIN);
    }

    /**
     * @return Collection<int, \stdClass>
     */
    public function leaderboard(Tenant $tenant, int $limit = 10): Collection
    {
        $this->bindTenant($tenant);

        return DB::table('community_xp_events')
            ->join('tenant_users', function ($join) {
                $join->on('tenant_users.id', '=', 'community_xp_events.tenant_user_id')
                    ->on('tenant_users.tenant_id', '=', 'community_xp_events.tenant_id');
            })
            ->join('users', 'users.id', '=', 'tenant_users.user_id')
            ->where('community_xp_events.tenant_id', $tenant->id)
            ->where('tenant_users.status', 'active')
            ->select([
                'community_xp_events.tenant_user_id',
                'tenant_users.avatar',
                'users.name',
                DB::raw('SUM(community_xp_events.xp) as total_xp'),
                DB::raw('COUNT(community_xp_events.id) as actions'),
                DB::raw('MAX(community_xp_events.created_at) as last_action_at'),
            ])
            ->groupBy('community_xp_events.tenant_user_id', 'tenant_users.avatar', 'users.name')
            ->orderByDesc('total_xp')
            ->limit($limit)
            ->get();
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
