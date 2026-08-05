<?php

namespace App\Http\Controllers\Api\v1\Community;

use App\Http\Controllers\Controller;
use App\Http\Requests\Community\BanCommunityMemberRequest;
use App\Http\Requests\Community\MuteCommunityMemberRequest;
use App\Http\Requests\Community\ReviewCommunityReportRequest;
use App\Http\Requests\Community\WarnCommunityMemberRequest;
use App\Http\Resources\Community\CommunityModerationActionResource;
use App\Http\Resources\Community\CommunityReportResource;
use App\Models\CommunityChannel;
use App\Models\CommunityParticipant;
use App\Models\CommunityReport;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Policies\CommunityModerationPolicy;
use App\Services\Community\CommunityModerationService;
use Illuminate\Http\JsonResponse;

class CommunityModerationController extends Controller
{
    public function reports(
        CommunityModerationService $moderation,
        CommunityModerationPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->moderate(app(TenantUser::class), $tenant), 403);

        return response()->json([
            'reports' => CommunityReportResource::collection($moderation->reports($tenant)),
        ]);
    }

    public function review(
        ReviewCommunityReportRequest $request,
        CommunityReport $report,
        CommunityModerationService $moderation,
        CommunityModerationPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->review(app(TenantUser::class), $tenant, $report), 403);

        $validated = $request->validated();

        return response()->json([
            'message' => 'Report reviewed.',
            'report' => new CommunityReportResource(
                $moderation->review($tenant, $report, app(TenantUser::class), $validated['action'], $validated['note'] ?? null),
            ),
        ]);
    }

    public function warn(
        WarnCommunityMemberRequest $request,
        TenantUser $subject,
        CommunityModerationService $moderation,
        CommunityModerationPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        $this->ensureSubjectInTenant($subject, $tenant);
        abort_unless($policy->moderate(app(TenantUser::class), $tenant), 403);

        return response()->json([
            'message' => 'Member warned.',
            'action' => new CommunityModerationActionResource(
                $moderation->warn($tenant, $subject, app(TenantUser::class), $request->validated()['reason']),
            ),
        ]);
    }

    public function mute(
        MuteCommunityMemberRequest $request,
        TenantUser $subject,
        CommunityModerationService $moderation,
        CommunityModerationPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        $this->ensureSubjectInTenant($subject, $tenant);
        abort_unless($policy->moderate(app(TenantUser::class), $tenant), 403);

        $validated = $request->validated();

        $participant = $moderation->mute(
            $tenant,
            $subject,
            app(TenantUser::class),
            (int) $validated['duration_minutes'],
            $validated['reason'] ?? null,
        );

        return response()->json([
            'message' => 'Member muted.',
            'participant' => $this->participantPayload($participant),
        ]);
    }

    public function unmute(
        TenantUser $subject,
        CommunityModerationService $moderation,
        CommunityModerationPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        $this->ensureSubjectInTenant($subject, $tenant);
        abort_unless($policy->moderate(app(TenantUser::class), $tenant), 403);

        return response()->json([
            'message' => 'Member unmuted.',
            'participant' => $this->participantPayload(
                $moderation->unmute($tenant, $subject, app(TenantUser::class)),
            ),
        ]);
    }

    public function ban(
        BanCommunityMemberRequest $request,
        TenantUser $subject,
        CommunityModerationService $moderation,
        CommunityModerationPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        $this->ensureSubjectInTenant($subject, $tenant);
        abort_unless($policy->moderate(app(TenantUser::class), $tenant), 403);

        $validated = $request->validated();

        $participant = $moderation->ban(
            $tenant,
            $subject,
            app(TenantUser::class),
            isset($validated['duration_minutes']) ? (int) $validated['duration_minutes'] : null,
            $validated['reason'] ?? null,
        );

        return response()->json([
            'message' => 'Member banned.',
            'participant' => $this->participantPayload($participant),
        ]);
    }

    public function unban(
        TenantUser $subject,
        CommunityModerationService $moderation,
        CommunityModerationPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        $this->ensureSubjectInTenant($subject, $tenant);
        abort_unless($policy->moderate(app(TenantUser::class), $tenant), 403);

        return response()->json([
            'message' => 'Member unbanned.',
            'participant' => $this->participantPayload(
                $moderation->unban($tenant, $subject, app(TenantUser::class)),
            ),
        ]);
    }

    public function actions(
        TenantUser $subject,
        CommunityModerationService $moderation,
        CommunityModerationPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        $this->ensureSubjectInTenant($subject, $tenant);
        abort_unless($policy->moderate(app(TenantUser::class), $tenant), 403);

        return response()->json([
            'actions' => CommunityModerationActionResource::collection($moderation->actionsFor($tenant, $subject)),
        ]);
    }

    public function lockChannel(
        CommunityChannel $channel,
        CommunityModerationService $moderation,
        CommunityModerationPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->lockChannel(app(TenantUser::class), $tenant, $channel), 403);

        $moderation->lockChannel($tenant, $channel, app(TenantUser::class), true);

        return response()->json(['message' => 'Channel locked.']);
    }

    public function unlockChannel(
        CommunityChannel $channel,
        CommunityModerationService $moderation,
        CommunityModerationPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->lockChannel(app(TenantUser::class), $tenant, $channel), 403);

        $moderation->lockChannel($tenant, $channel, app(TenantUser::class), false);

        return response()->json(['message' => 'Channel unlocked.']);
    }

    private function ensureSubjectInTenant(TenantUser $subject, Tenant $tenant): void
    {
        abort_if($subject->tenant_id !== $tenant->id, 404);
    }

    /**
     * @return array<string, mixed>
     */
    private function participantPayload(CommunityParticipant $participant): array
    {
        return [
            'id' => (string) $participant->id,
            'tenant_user_id' => (string) $participant->tenant_user_id,
            'status' => $participant->status,
            'muted_until' => $participant->muted_until?->toIso8601String(),
            'muted_reason' => $participant->muted_reason,
            'banned_until' => $participant->banned_until?->toIso8601String(),
            'banned_reason' => $participant->banned_reason,
        ];
    }
}
