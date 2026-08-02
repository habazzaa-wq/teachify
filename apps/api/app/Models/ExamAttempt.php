<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExamAttempt extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'exam_id',
        'user_id',
        'score',
        'max_score',
        'percentage',
        'passed',
        'is_official',
        'is_practice',
        'status',
        'duration_seconds',
        'current_question_index',
        'started_at',
        'submitted_at',
        'timer_ends_at',
        'anti_cheat_events',
        'practice_source_attempt_id',
        'included_exam_question_ids',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'max_score' => 'decimal:2',
        'percentage' => 'decimal:2',
        'passed' => 'boolean',
        'is_official' => 'boolean',
        'is_practice' => 'boolean',
        'duration_seconds' => 'integer',
        'current_question_index' => 'integer',
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
        'timer_ends_at' => 'datetime',
        'anti_cheat_events' => 'array',
        'included_exam_question_ids' => 'array',
        'deleted_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(ExamAttemptAnswer::class);
    }

    public function antiCheatEvents(): HasMany
    {
        return $this->hasMany(ExamAntiCheatEvent::class, 'exam_attempt_id');
    }

    public function practiceSource(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'practice_source_attempt_id');
    }
}
