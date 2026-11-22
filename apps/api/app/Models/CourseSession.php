<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourseSession extends Model
{
    use BelongsToTenant, SoftDeletes;

    public const DELIVERY_TYPE_LIVE = 'live';

    public const DELIVERY_TYPE_FIELD = 'field';

    public const DELIVERY_TYPE_OFFLINE = 'offline';

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SCHEDULED = 'scheduled';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_COMPLETED = 'completed';

    public const SESSION_TYPES = [
        self::DELIVERY_TYPE_LIVE,
        self::DELIVERY_TYPE_FIELD,
        self::DELIVERY_TYPE_OFFLINE,
    ];

    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_SCHEDULED,
        self::STATUS_CANCELLED,
        self::STATUS_COMPLETED,
    ];

    protected $fillable = [
        'tenant_id',
        'course_id',
        'created_by_tenant_user_id',
        'instructor_tenant_user_id',
        'title',
        'description',
        'session_type',
        'status',
        'starts_at_utc',
        'ends_at_utc',
        'timezone',
        'meeting_url',
        'meeting_provider',
        'location_name',
        'location_address',
        'location_latitude',
        'location_longitude',
        'location_maps_url',
        'cancellation_reason',
        'cancelled_at',
        'rescheduled_from_starts_at_utc',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'starts_at_utc' => 'datetime',
            'ends_at_utc' => 'datetime',
            'cancelled_at' => 'datetime',
            'rescheduled_from_starts_at_utc' => 'datetime',
            'location_latitude' => 'decimal:7',
            'location_longitude' => 'decimal:7',
            'metadata' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'created_by_tenant_user_id');
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'instructor_tenant_user_id');
    }

    public function sessionEnrollments(): HasMany
    {
        return $this->hasMany(CourseSessionEnrollment::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(SessionAttendance::class);
    }

    public function scheduledNotificationDispatches(): HasMany
    {
        return $this->hasMany(ScheduledNotificationDispatch::class);
    }
}
