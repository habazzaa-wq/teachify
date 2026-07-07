<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LearnerAnalytics extends Model
{
    use BelongsToTenant;

    protected $table = 'learner_analytics';

    protected $fillable = [
        'tenant_id',
        'tenant_user_id',
        'enrolled_courses_count',
        'completed_courses_count',
        'average_progress_percent',
        'average_quiz_score',
        'average_assignment_score',
        'last_activity_at',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'enrolled_courses_count' => 'integer',
            'completed_courses_count' => 'integer',
            'average_progress_percent' => 'float',
            'average_quiz_score' => 'float',
            'average_assignment_score' => 'float',
            'last_activity_at' => 'datetime',
            'generated_at' => 'datetime',
        ];
    }

    public function learner(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'tenant_user_id');
    }
}
