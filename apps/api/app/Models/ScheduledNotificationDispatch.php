<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduledNotificationDispatch extends Model
{
    use BelongsToTenant;

    public const STATUS_PENDING = 'pending';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_SENT = 'sent';

    public const STATUS_SKIPPED = 'skipped';

    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'tenant_id',
        'course_session_id',
        'tenant_user_id',
        'reminder_type',
        'scheduled_for_utc',
        'session_starts_at_utc_snapshot',
        'status',
        'cancelled_reason',
        'dispatched_at',
        'dedupe_key',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_for_utc' => 'datetime',
            'session_starts_at_utc_snapshot' => 'datetime',
            'dispatched_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(CourseSession::class, 'course_session_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'tenant_user_id');
    }
}
