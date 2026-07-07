<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizAnalytics extends Model
{
    use BelongsToTenant;

    protected $table = 'quiz_analytics';

    protected $fillable = [
        'tenant_id',
        'quiz_id',
        'attempt_count',
        'unique_learners',
        'average_score',
        'pass_rate',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'attempt_count' => 'integer',
            'unique_learners' => 'integer',
            'average_score' => 'float',
            'pass_rate' => 'float',
            'generated_at' => 'datetime',
        ];
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }
}
