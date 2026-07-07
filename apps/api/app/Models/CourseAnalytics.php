<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseAnalytics extends Model
{
    use BelongsToTenant;

    protected $table = 'course_analytics';

    protected $fillable = [
        'tenant_id',
        'course_id',
        'enrollments_count',
        'active_learners_count',
        'completed_learners_count',
        'completion_rate',
        'average_progress_percent',
        'average_quiz_score',
        'average_assignment_score',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'enrollments_count' => 'integer',
            'active_learners_count' => 'integer',
            'completed_learners_count' => 'integer',
            'completion_rate' => 'float',
            'average_progress_percent' => 'float',
            'average_quiz_score' => 'float',
            'average_assignment_score' => 'float',
            'generated_at' => 'datetime',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
