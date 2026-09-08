<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamAttemptAnswer extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'exam_attempt_id',
        'exam_question_id',
        'question_id',
        'answer',
        'answer_mode',
        'grading_status',
        'is_correct',
        'earned_points',
        'manual_score',
        'feedback',
        'graded_by_tenant_user_id',
        'graded_at',
        'answered_at',
    ];

    protected $casts = [
        'answer' => 'array',
        'answer_mode' => 'string',
        'grading_status' => 'string',
        'is_correct' => 'boolean',
        'earned_points' => 'integer',
        'manual_score' => 'decimal:2',
        'graded_by_tenant_user_id' => 'integer',
        'graded_at' => 'datetime',
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

    public function pages(): HasMany
    {
        return $this->hasMany(ExamAttemptAnswerPage::class)->orderBy('page_order');
    }

    public function grader(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'graded_by_tenant_user_id');
    }
}
