<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAttemptAnswer extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'exam_attempt_id',
        'exam_question_id',
        'question_id',
        'answer',
        'is_correct',
        'earned_points',
        'answered_at',
    ];

    protected $casts = [
        'answer' => 'array',
        'is_correct' => 'boolean',
        'earned_points' => 'integer',
        'answered_at' => 'datetime',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'exam_attempt_id');
    }

    public function examQuestion(): BelongsTo
    {
        return $this->belongsTo(ExamQuestion::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
