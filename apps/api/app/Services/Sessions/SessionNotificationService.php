<?php

namespace App\Services\Sessions;

use App\Models\CourseSession;
use App\Models\CourseSessionEnrollment;
use App\Models\ScheduledNotificationDispatch;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Notifications\NotificationEventService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SessionNotificationService
{
    /** @var array<int,int> minutes before start */
    public const DEFAULT_REMINDER_MINUTES = [1440, 60];

    public function __construct(private readonly NotificationEventService $events)
    {
    }

    public function onSessionScheduled(Tenant $tenant, CourseSession $session): void
    {
        $this->cancelPendingDispatches($session, 'rescheduled_or_recreated');
        $this->scheduleReminders($tenant, $session);
        $this->notifyEnrolled($tenant, $session, 'session.scheduled', 'Session scheduled');
    }

    public function onSessionRescheduled(Tenant $tenant, CourseSession $session): void
    {
        $this->cancelPendingDispatches($session, 'rescheduled');
        $this->scheduleReminders($tenant, $session);
        $this->notifyEnrolled($tenant, $session, 'session.rescheduled', 'Session rescheduled');
    }

    public function onSessionCancelled(Tenant $tenant, CourseSession $session): void
    {
        $this->cancelPendingDispatches($session, 'session_cancelled');
        $this->notifyEnrolled($tenant, $session, 'session.cancelled', 'Session cancelled');
    }

    public function onSessionCompleted(Tenant $tenant, CourseSession $session): void
    {
        $this->cancelPendingDispatches($session, 'session_completed');
    }

    public function scheduleReminders(Tenant $tenant, CourseSession $session): void
    {
        if ($session->status !== CourseSession::STATUS_SCHEDULED || ! $session->starts_at_utc) {
            return;
        }

        $offsets = $this->reminderOffsets($tenant);
        $recipients = $this->eligibleRecipientIds($tenant, $session);

        foreach ($recipients as $recipientId) {
            foreach ($offsets as $minutes) {
                $scheduledFor = Carbon::parse($session->starts_at_utc)->subMinutes($minutes);
                if ($scheduledFor->isPast()) {
                    continue;
                }
                $dedupe = implode(':', [
                    'tenant', $tenant->id,
                    'session', $session->id,
                    'user', $recipientId,
                    'reminder', $minutes,
                    'start', Carbon::parse($session->starts_at_utc)->timestamp,
                ]);

                ScheduledNotificationDispatch::query()->firstOrCreate(
                    ['tenant_id' => $tenant->id, 'dedupe_key' => $dedupe],
                    [
                        'course_session_id' => $session->id,
                        'tenant_user_id' => $recipientId,
                        'reminder_type' => 'session_reminder_'.$minutes,
                        'scheduled_for_utc' => $scheduledFor,
                        'session_starts_at_utc_snapshot' => $session->starts_at_utc,
                        'status' => ScheduledNotificationDispatch::STATUS_PENDING,
                        'metadata' => ['minutes_before' => $minutes],
                    ]
                );
            }
        }
    }

    public function cancelPendingDispatches(CourseSession $session, string $reason): void
    {
        ScheduledNotificationDispatch::query()
            ->where('tenant_id', $session->tenant_id)
            ->where('course_session_id', $session->id)
            ->where('status', ScheduledNotificationDispatch::STATUS_PENDING)
            ->update([
                'status' => ScheduledNotificationDispatch::STATUS_CANCELLED,
                'cancelled_reason' => $reason,
                'updated_at' => now(),
            ]);
    }

    private function notifyEnrolled(Tenant $tenant, CourseSession $session, string $eventType, string $title): void
    {
        $session->loadMissing('course');
        $recipients = TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', $this->eligibleRecipientIds($tenant, $session))
            ->where('status', 'active')
            ->get();

        foreach ($recipients as $recipient) {
            $this->events->record($tenant, $eventType, $eventType.':session-'.$session->id.':user-'.$recipient->id.':'.($session->updated_at?->timestamp ?? now()->timestamp), [
                'tenant_user_id' => $recipient->id,
                'course_id' => $session->course_id,
                'course_session_id' => $session->id,
                'course_title' => $session->course?->title,
                'session_title' => $session->title,
                'starts_at_utc' => $session->starts_at_utc?->toIso8601String(),
                'timezone' => $session->timezone,
                'title' => $title,
                'body' => $session->title,
            ]);
        }
    }

    /** @return array<int,int> */
    private function eligibleRecipientIds(Tenant $tenant, CourseSession $session): array
    {
        return CourseSessionEnrollment::query()
            ->where('tenant_id', $tenant->id)
            ->where('course_session_id', $session->id)
            ->where('status', CourseSessionEnrollment::STATUS_ENROLLED)
            ->whereHas('courseEnrollment', fn ($q) => $q->where('status', 'active'))
            ->pluck('tenant_user_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /** @return array<int,int> */
    private function reminderOffsets(Tenant $tenant): array
    {
        $configured = data_get($tenant->settings_json, 'session_reminders.minutes_before');
        if (is_array($configured) && $configured !== []) {
            return collect($configured)->map(fn ($v) => (int) $v)->filter(fn ($v) => $v > 0)->unique()->values()->all();
        }

        return self::DEFAULT_REMINDER_MINUTES;
    }
}
