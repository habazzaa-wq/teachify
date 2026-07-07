<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseAccessRule extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'course_id',
        'access_mode',
        'requires_approval',
        'allow_self_enrollment',
        'invite_only',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'requires_approval' => 'boolean',
            'allow_self_enrollment' => 'boolean',
            'invite_only' => 'boolean',
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
}
