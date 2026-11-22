<?php

namespace App\Console\Commands;

use App\Jobs\Sessions\SendScheduledSessionReminderJob;
use App\Models\ScheduledNotificationDispatch;
use Illuminate\Console\Command;

class DispatchDueSessionRemindersCommand extends Command
{
    protected $signature = 'sessions:dispatch-reminders {--limit=200}';

    protected $description = 'Dispatch due session reminder notifications.';

    public function handle(): int
    {
        $limit = max(1, (int) $this->option('limit'));

        $dispatches = ScheduledNotificationDispatch::query()
            ->where('status', ScheduledNotificationDispatch::STATUS_PENDING)
            ->where('scheduled_for_utc', '<=', now())
            ->orderBy('scheduled_for_utc')
            ->limit($limit)
            ->get();

        foreach ($dispatches as $dispatch) {
            SendScheduledSessionReminderJob::dispatch($dispatch->id, $dispatch->tenant_id)->onQueue('notifications');
        }

        $this->info('Dispatched '.$dispatches->count().' reminder(s).');

        return self::SUCCESS;
    }
}
