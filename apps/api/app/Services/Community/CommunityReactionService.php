<?php

namespace App\Services\Community;

use App\Events\Community\CommunityMessageReactionUpdated;
use App\Models\CommunityMessage;
use App\Models\CommunityMessageReaction;
use App\Models\CommunityStat;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CommunityReactionService
{
    public function __construct(
        private readonly CommunityAccessService $access,
        private readonly CommunityStatsService $stats,
        private readonly CommunityNotificationService $notifications,
        private readonly CommunityGamificationService $gamification,
    ) {}

    /**
     * @return array{action: string, reaction: array<string, mixed>}
     */
    public function toggle(Tenant $tenant, CommunityMessage $message, TenantUser $member, string $emoji): array
    {
        $existing = CommunityMessageReaction::query()
            ->where('tenant_id', $tenant->id)
            ->where('message_id', $message->id)
            ->where('tenant_user_id', $member->id)
            ->where('emoji', $emoji)
            ->first();

        if ($existing !== null) {
            $this->remove($tenant, $message, $member, $emoji, $existing);

            return [
                'action' => CommunityMessageReactionUpdated::ACTION_REMOVED,
                'reaction' => $this->reactionPayload($member, $emoji),
            ];
        }

        $this->add($tenant, $message, $member, $emoji);

        return [
            'action' => CommunityMessageReactionUpdated::ACTION_ADDED,
            'reaction' => $this->reactionPayload($member, $emoji),
        ];
    }

    public function add(Tenant $tenant, CommunityMessage $message, TenantUser $member, string $emoji): CommunityMessageReaction
    {
        $this->bindTenant($tenant);
        $this->ensureMessageInTenant($tenant, $message);
        $this->ensureNotDeleted($message);
        $this->ensureCanReact($member, $tenant, $message);
        $this->ensureValidEmoji($emoji);

        $reaction = DB::transaction(function () use ($tenant, $message, $member, $emoji): CommunityMessageReaction {
            $reaction = CommunityMessageReaction::firstOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'message_id' => $message->id,
                    'tenant_user_id' => $member->id,
                    'emoji' => $emoji,
                ],
            );

            $this->stats->increment($tenant, CommunityStat::TOTAL_REACTIONS);

            if ($message->tenant_user_id !== $member->id) {
                $this->gamification->award(
                    $tenant,
                    $message->author,
                    'reaction_received',
                    CommunityGamificationService::XP_REACTION_RECEIVED,
                    $message->id,
                );
                $this->notifications->notifyReaction($tenant, $message, $member);
            }

            return $reaction;
        });

        $this->broadcast($tenant, $message, $member, $emoji, CommunityMessageReactionUpdated::ACTION_ADDED);

        return $reaction;
    }

    public function remove(
        Tenant $tenant,
        CommunityMessage $message,
        TenantUser $member,
        string $emoji,
        ?CommunityMessageReaction $reaction = null,
    ): void {
        $this->bindTenant($tenant);
        $this->ensureMessageInTenant($tenant, $message);

        $reaction ??= CommunityMessageReaction::query()
            ->where('tenant_id', $tenant->id)
            ->where('message_id', $message->id)
            ->where('tenant_user_id', $member->id)
            ->where('emoji', $emoji)
            ->first();

        if ($reaction === null) {
            throw ValidationException::withMessages([
                'reaction' => ['The reaction does not exist.'],
            ]);
        }

        DB::transaction(function () use ($reaction, $tenant): void {
            $reaction->delete();
            $this->stats->decrement($tenant, CommunityStat::TOTAL_REACTIONS);
        });

        $this->broadcast($tenant, $message, $member, $reaction->emoji, CommunityMessageReactionUpdated::ACTION_REMOVED);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function forMessage(Tenant $tenant, CommunityMessage $message): array
    {
        return CommunityMessageReaction::query()
            ->where('tenant_id', $tenant->id)
            ->where('message_id', $message->id)
            ->with('member.user')
            ->get()
            ->groupBy('emoji')
            ->map(fn ($group, string $emoji) => [
                'emoji' => $emoji,
                'count' => $group->count(),
                'members' => $group->map(fn (CommunityMessageReaction $reaction) => [
                    'id' => $reaction->member?->id,
                    'name' => $reaction->member?->user?->name,
                    'avatar' => $reaction->member?->avatar,
                ])->values()->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function reactionPayload(TenantUser $member, string $emoji): array
    {
        return [
            'emoji' => $emoji,
            'member' => [
                'id' => $member->id,
                'name' => $member->user?->name,
                'avatar' => $member->avatar,
            ],
        ];
    }

    private function broadcast(
        Tenant $tenant,
        CommunityMessage $message,
        TenantUser $member,
        string $emoji,
        string $action,
    ): void {
        CommunityMessageReactionUpdated::dispatch(
            $this->reactionPayload($member, $emoji),
            $action,
            $message->id,
            $tenant->id,
            $message->channel_id,
            $message->thread_id,
        );
    }

    private function ensureCanReact(TenantUser $member, Tenant $tenant, CommunityMessage $message): void
    {
        if (! $this->access->canPost($member, $tenant, $message->channel)) {
            throw ValidationException::withMessages([
                'message' => ['You are not allowed to react to messages here.'],
            ]);
        }
    }

    private function ensureValidEmoji(string $emoji): void
    {
        if (mb_strlen($emoji) < 1 || mb_strlen($emoji) > 32) {
            throw ValidationException::withMessages([
                'emoji' => ['The emoji is invalid.'],
            ]);
        }
    }

    private function ensureMessageInTenant(Tenant $tenant, CommunityMessage $message): void
    {
        if ($message->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'message' => ['The message is invalid for this tenant.'],
            ]);
        }
    }

    private function ensureNotDeleted(CommunityMessage $message): void
    {
        if ($message->isDeleted()) {
            throw ValidationException::withMessages([
                'message' => ['This message has been deleted.'],
            ]);
        }
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
