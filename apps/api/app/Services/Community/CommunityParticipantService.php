<?php

namespace App\Services\Community;

use App\Models\CommunityParticipant;
use App\Models\CommunityStat;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CommunityParticipantService
{
    public function __construct(
        private readonly CommunityAccessService $access,
        private readonly CommunityStatsService $stats,
    ) {}

    public function participantFor(Tenant $tenant, TenantUser $member): ?CommunityParticipant
    {
        if ($this->access->isSuperAdmin($member)) {
            return null;
        }

        return CommunityParticipant::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $member->id)
            ->first();
    }

    /**
     * Persist a membership record (or restore a soft-deleted one) so the
     * member shows up in community presence, counts and leaderboards.
     */
    public function join(Tenant $tenant, TenantUser $member): CommunityParticipant
    {
        $this->bindTenant($tenant);
        $this->ensureMemberInTenant($tenant, $member);

        if ($this->access->isSuperAdmin($member)) {
            throw ValidationException::withMessages([
                'community' => ['Platform admins do not require a membership.'],
            ]);
        }

        return DB::transaction(function () use ($tenant, $member): CommunityParticipant {
            $existing = CommunityParticipant::query()
                ->where('tenant_id', $tenant->id)
                ->where('tenant_user_id', $member->id)
                ->withTrashed()
                ->first();

            $isNewJoin = $existing === null || $existing->trashed();

            if ($existing === null) {
                $participant = CommunityParticipant::create([
                    'tenant_id' => $tenant->id,
                    'tenant_user_id' => $member->id,
                    'role' => $this->access->roleFor($member, $tenant),
                    'status' => 'active',
                    'joined_at' => now(),
                ]);
            } else {
                $existing->restore();
                $participant = $existing->forceFill([
                    'status' => 'active',
                    'joined_at' => now(),
                ]);
                $participant->save();
            }

            if ($isNewJoin) {
                $this->stats->increment($tenant, CommunityStat::ACTIVE_MEMBERS);
            }

            return $participant->refresh();
        });
    }

    public function leave(Tenant $tenant, TenantUser $member): void
    {
        $this->bindTenant($tenant);

        $participant = $this->participantFor($tenant, $member);

        if ($participant === null) {
            return;
        }

        DB::transaction(function () use ($participant): void {
            $participant->forceFill(['status' => 'left'])->save();
            $participant->delete();
        });

        $this->stats->decrement($tenant, CommunityStat::ACTIVE_MEMBERS);
    }

    public function activeMemberCount(Tenant $tenant): int
    {
        return CommunityParticipant::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'active')
            ->count();
    }

    /**
     * Presence payload for the Reverb presence channel. The frontend only
     * relies on an id (member/tenant_user) for the online roster.
     */
    public function presencePayload(Tenant $tenant, TenantUser $member): array
    {
        $this->bindTenant($tenant);

        return [
            'id' => (string) $member->id,
            'tenant_user_id' => (string) $member->id,
            'user_id' => (string) $member->user_id,
            'name' => $member->user?->name,
            'avatar' => $member->avatar,
        ];
    }

    private function ensureMemberInTenant(Tenant $tenant, TenantUser $member): void
    {
        if ($member->tenant_id !== $tenant->id || $member->status !== 'active') {
            throw ValidationException::withMessages([
                'tenant_user_id' => ['The member is invalid for this tenant.'],
            ]);
        }
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
