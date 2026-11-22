<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionAttendance extends Model
{
    use BelongsToTenant;

    protected $table = 'session_attendance';

    public const STATUS_PENDING = 'pending';

    public const STATUS_PRESENT = 'present';

    public const STATUS_ABSENT = 'absent';

    public const STATUS_LATE = 'late';

    public const STATUS_EXCUSED = 'excused';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PRESENT,
        self::STATUS_ABSENT,
        self::STATUS_LATE,
        self::STATUS_EXCUSED,
    ];

    protected $fillable = [
        'tenant_id',
        'course_session_id',
        'course_session_enrollment_id',
        'tenant_user_id',
        'status',
        'marked_by_tenant_user_id',
        'marked_at',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'marked_at' => 'datetime',
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

    public function sessionEnrollment(): BelongsTo
    {
        return $this->belongsTo(CourseSessionEnrollment::class, 'course_session_enrollment_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'tenant_user_id');
    }

    public function markedBy(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'marked_by_tenant_user_id');
    }
}
