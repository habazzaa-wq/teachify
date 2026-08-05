<?php

namespace App\Services\Community;

use App\Models\CommunityChannel;
use App\Models\CommunityMessage;
use App\Models\CommunityModerationAction;
use App\Models\CommunityParticipant;
use App\Models\CommunityReport;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Security\AuditLogger;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CommunityModerationService
{
    public const ACTION_WARN = 'warn';

    public const ACTION_MUTE = 'mute';

    public const ACTION_BAN = 'ban';

    public const ACTION_HIDE = 'hide';

    public const ACTION_DISMISS = 'dismiss';

    public function __construct(
        private readonly CommunityAccessService $access,
        private readonly CommunityParticipantService $participants,
        private readonly CommunityNotificationService $notifications,
        private readonly AuditLogger $audit,
    ) {}

    public function report(
        Tenant $tenant,
        CommunityMessage $message,
        TenantUser $reporter,
        string $reason,
        ?string $note = null,
    ): CommunityReport {
        $this->bindTenant($tenant);
        $this->ensureMessageInTenant($tenant, $message);

        if ($message->tenant_user_id === $reporter->id) {
            throw ValidationException::withMessages([
                'message' => ['You cannot report your own message.'],
            ]);
        }

        $duplicate = CommunityReport::query()
            ->where('tenant_id', $tenant->id)
            ->where('message_id', $message->id)
            ->where('reported_by_tenant_user_id', $reporter->id)
            ->where('status', 'pending')
            ->exists();

        if ($duplicate) {
            throw ValidationException::withMessages([
                'message' => ['You already reported this message.'],
            ]);
        }

        return CommunityReport::create([
            'tenant_id' => $tenant->id,
            'message_id' => $message->id,
            'reported_by_tenant_user_id' => $reporter->id,
            'reason' => $reason,
            'note' => $note,
            'status' => 'pending',
        ])->refresh();
    }

    /**
     * @return Collection<int, CommunityReport>
     */
    public function reports(Tenant $tenant, string $status = 'pending'): Collection
    {
        $this->bindTenant($tenant);

        return CommunityReport::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', $status)
            ->with(['message.author.user', 'reporter.user'])
            ->orderByDesc('created_at')
            ->get();
    }

    public function review(
        Tenant $tenant,
        CommunityReport $report,
        TenantUser $moderator,
        string $action,
        ?string $note = null,
    ): CommunityReport {
        $this->bindTenant($tenant);
        $this->ensureReportInTenant($tenant, $report);
        $this->access->ensureCanModerate($moderator, $tenant);

        if (! $report->isOpen()) {
            throw ValidationException::withMessages([
                'report' => ['This report has already been reviewed.'],
            ]);
        }

        DB::transaction(function () use ($report, $moderator, $action, $note): void {
            $message = $report->message;

            if ($action === self::ACTION_HIDE && $message !== null) {
                $message->forceFill(['status' => 'hidden'])->save();
            }

            $report->forceFill([
                'status' => $action === self::ACTION_DISMISS ? 'dismissed' : 'resolved',
                'reviewed_by_tenant_user_id' => $moderator->id,
                'reviewed_at' => now(),
                'metadata' => array_merge($report->metadata ?? [], [
                    'action' => $action,
                    'note' => $note,
                ]),
            ])->save();
        });

        $this->audit->record('community.report.reviewed', [
            'tenant_id' => $tenant->id,
            'report_id' => $report->id,
            'action' => $action,
            'moderator_id' => $moderator->id,
        ]);

        return $report->refresh();
    }

    public function mute(
        Tenant $tenant,
        TenantUser $subject,
        TenantUser $moderator,
        int $durationMinutes,
        ?string $reason = null,
    ): CommunityParticipant {
        $this->bindTenant($tenant);
        $this->access->ensureCanModerate($moderator, $tenant);
        $this->ensureCanModerateSubject($moderator, $tenant, $subject);

        $participant = $this->ensureParticipant($tenant, $subject);

        $expiresAt = now()->addMinutes($durationMinutes);

        $participant->forceFill([
            'status' => 'muted',
            'muted_until' => $expiresAt,
            'muted_reason' => $reason,
        ])->save();

        $this->recordAction($tenant, $subject, $moderator, self::ACTION_MUTE, null, null, $reason, $durationMinutes, $expiresAt);

        $this->notifications->send($tenant, $subject, 'community.moderated', 'You were muted',
            'A moderator muted you from the community.', ['duration_minutes' => $durationMinutes]);

        return $participant->refresh();
    }

    public function unmute(Tenant $tenant, TenantUser $subject, TenantUser $moderator): CommunityParticipant
    {
        $this->bindTenant($tenant);
        $this->access->ensureCanModerate($moderator, $tenant);

        $participant = $this->ensureParticipant($tenant, $subject);
        $participant->forceFill([
            'status' => 'active',
            'muted_until' => null,
            'muted_reason' => null,
        ])->save();

        $this->recordAction($tenant, $subject, $moderator, 'unmute', null, null, null, null, null);

        return $participant->refresh();
    }

    public function ban(
        Tenant $tenant,
        TenantUser $subject,
        TenantUser $moderator,
        ?int $durationMinutes = null,
        ?string $reason = null,
        ?CommunityChannel $channel = null,
        ?CommunityMessage $message = null,
    ): CommunityParticipant {
        $this->bindTenant($tenant);
        $this->access->ensureCanModerate($moderator, $tenant);
        $this->ensureCanModerateSubject($moderator, $tenant, $subject);

        $participant = $this->ensureParticipant($tenant, $subject);
        $expiresAt = $durationMinutes !== null ? now()->addMinutes($durationMinutes) : null;

        $participant->forceFill([
            'status' => 'banned',
            'banned_until' => $expiresAt,
            'banned_reason' => $reason,
        ])->save();

        $this->recordAction($tenant, $subject, $moderator, self::ACTION_BAN, $channel, $message, $reason, $durationMinutes, $expiresAt);

        $this->notifications->send($tenant, $subject, 'community.moderated', 'You were banned',
            'A moderator banned you from the community.', ['reason' => $reason, 'duration_minutes' => $durationMinutes]);

        return $participant->refresh();
    }

    public function unban(Tenant $tenant, TenantUser $subject, TenantUser $moderator): CommunityParticipant
    {
        $this->bindTenant($tenant);
        $this->access->ensureCanModerate($moderator, $tenant);

        $participant = $this->ensureParticipant($tenant, $subject);
        $participant->forceFill([
            'status' => 'active',
            'banned_until' => null,
            'banned_reason' => null,
        ])->save();

        $this->recordAction($tenant, $subject, $moderator, 'unban', null, null, null, null, null);

        return $participant->refresh();
    }

    public function warn(
        Tenant $tenant,
        TenantUser $subject,
        TenantUser $moderator,
        string $reason,
        ?CommunityChannel $channel = null,
    ): CommunityModerationAction {
        $this->bindTenant($tenant);
        $this->access->ensureCanModerate($moderator, $tenant);
        $this->ensureCanModerateSubject($moderator, $tenant, $subject);

        $action = $this->recordAction($tenant, $subject, $moderator, self::ACTION_WARN, $channel, null, $reason, null, null);

        $this->notifications->send($tenant, $subject, 'community.warning', 'Community warning',
            'A moderator issued you a warning.', ['reason' => $reason]);

        return $action;
    }

    public function lockChannel(Tenant $tenant, CommunityChannel $channel, TenantUser $moderator, bool $locked): CommunityChannel
    {
        $this->bindTenant($tenant);
        $this->access->ensureCanModerateChannel($moderator, $tenant, $channel);

        $channel->forceFill(['is_locked' => $locked])->save();

        $this->audit->record('community.channel.locked', [
            'tenant_id' => $tenant->id,
            'channel_id' => $channel->id,
            'locked' => $locked,
            'moderator_id' => $moderator->id,
        ]);

        return $channel->refresh();
    }

    /**
     * @return Collection<int, CommunityModerationAction>
     */
    public function actionsFor(Tenant $tenant, TenantUser $subject): Collection
    {
        $this->bindTenant($tenant);

        return CommunityModerationAction::query()
            ->where('tenant_id', $tenant->id)
            ->where('subject_tenant_user_id', $subject->id)
            ->with(['moderator.user', 'channel', 'message'])
            ->orderByDesc('created_at')
            ->get();
    }

    private function ensureParticipant(Tenant $tenant, TenantUser $subject): CommunityParticipant
    {
        $participant = $this->participants->participantFor($tenant, $subject);

        if ($participant === null) {
            throw ValidationException::withMessages([
                'subject_tenant_user_id' => ['The member has not joined the community.'],
            ]);
        }

        return $participant;
    }

    private function ensureCanModerateSubject(TenantUser $moderator, Tenant $tenant, TenantUser $subject): void
    {
        if ($this->access->roleFor($subject, $tenant) !== CommunityAccessService::ROLE_MEMBER
            && ! $this->access->isSuperAdmin($moderator)) {
            throw ValidationException::withMessages([
                'subject_tenant_user_id' => ['Moderators cannot be moderated.'],
            ]);
        }
    }

    private function recordAction(
        Tenant $tenant,
        TenantUser $subject,
        TenantUser $moderator,
        string $action,
        ?CommunityChannel $channel,
        ?CommunityMessage $message,
        ?string $reason,
        ?int $durationMinutes,
        ?\DateTimeInterface $expiresAt,
    ): CommunityModerationAction {
        $record = CommunityModerationAction::create([
            'tenant_id' => $tenant->id,
            'subject_tenant_user_id' => $subject->id,
            'moderator_tenant_user_id' => $moderator->id,
            'action' => $action,
            'channel_id' => $channel?->id,
            'message_id' => $message?->id,
            'reason' => $reason,
            'duration_minutes' => $durationMinutes,
            'expires_at' => $expiresAt,
            'metadata' => [],
        ])->refresh();

        $this->audit->record('community.moderated', [
            'tenant_id' => $tenant->id,
            'action' => $action,
            'subject_id' => $subject->id,
            'moderator_id' => $moderator->id,
        ]);

        return $record;
    }

    private function ensureMessageInTenant(Tenant $tenant, CommunityMessage $message): void
    {
        if ($message->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'message' => ['The message is invalid for this tenant.'],
            ]);
        }
    }

    private function ensureReportInTenant(Tenant $tenant, CommunityReport $report): void
    {
        if ($report->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'report' => ['The report is invalid for this tenant.'],
            ]);
        }
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
