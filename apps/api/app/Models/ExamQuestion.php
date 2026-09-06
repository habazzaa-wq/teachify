<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamQuestion extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'created_by_tenant_user_id',
        'exam_id',
        'question_id',
        'section',
        'order',
        'points',
    ];

    protected $casts = [
        'order' => 'integer',
        'points' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
