<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAntiCheatEvent extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'exam_attempt_id',
        'event_type',
        'occurred_at',
        'metadata',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'exam_attempt_id');
    }
}
