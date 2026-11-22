<?php

namespace App\Jobs\Sessions;

use App\Models\CourseSession;
use App\Models\ScheduledNotificationDispatch;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Queue\Middleware\SetCorrelationContext;
use App\Queue\Middleware\SetTenantContext;
use App\Services\Notifications\NotificationEventService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendScheduledSessionReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    public function __construct(public int $dispatchId, public int $tenantId)
    {
        $this->onQueue('notifications');
    }

    public function middleware(): array
    {
        return [new SetTenantContext($this->tenantId), new SetCorrelationContext()];
    }

    public function handle(NotificationEventService $events): void
    {
        $dispatch = ScheduledNotificationDispatch::withoutGlobalScopes()
            ->where('id', $this->dispatchId)
            ->where('tenant_id', $this->tenantId)
            ->first();

        if (! $dispatch || $dispatch->status !== ScheduledNotificationDispatch::STATUS_PENDING) {
            return;
        }

        $session = CourseSession::withoutGlobalScopes()
            ->where('id', $dispatch->course_session_id)
            ->where('tenant_id', $this->tenantId)
            ->first();

        if (! $session || ! in_array($session->status, [CourseSession::STATUS_SCHEDULED], true)) {
            $dispatch->forceFill(['status' => ScheduledNotificationDispatch::STATUS_CANCELLED, 'cancelled_reason' => 'session_not_eligible'])->save();
            return;
        }

        if ($session->starts_at_utc && $session->starts_at_utc->isPast()) {
            $dispatch->forceFill(['status' => ScheduledNotificationDispatch::STATUS_SKIPPED, 'cancelled_reason' => 'session_started'])->save();
            return;
        }

        $tenant = Tenant::withoutGlobalScopes()->find($this->tenantId);
        $recipient = TenantUser::withoutGlobalScopes()->where('id', $dispatch->tenant_user_id)->where('tenant_id', $this->tenantId)->where('status', 'active')->first();
        if (! $tenant || ! $recipient) {
            $dispatch->forceFill(['status' => ScheduledNotificationDispatch::STATUS_SKIPPED, 'cancelled_reason' => 'recipient_unavailable'])->save();
            return;
        }

        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);

        $events->record($tenant, 'session.reminder', 'session-reminder:'.$dispatch->dedupe_key, [
            'tenant_user_id' => $recipient->id,
            'course_id' => $session->course_id,
            'course_session_id' => $session->id,
            'session_title' => $session->title,
            'starts_at_utc' => $session->starts_at_utc?->toIso8601String(),
            'timezone' => $session->timezone,
            'title' => 'Session reminder',
            'body' => $session->title,
        ]);

        $dispatch->forceFill([
            'status' => ScheduledNotificationDispatch::STATUS_SENT,
            'dispatched_at' => now(),
        ])->save();
    }

    public function failed(Throwable $exception): void
    {
        Log::warning('session-reminder.dispatch_failed', [
            'tenant_id' => $this->tenantId,
            'dispatch_id' => $this->dispatchId,
            'error' => $exception->getMessage(),
        ]);
    }
}
