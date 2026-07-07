<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Assignment extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'course_id',
        'course_section_id',
        'course_lesson_id',
        'title',
        'description',
        'instructions',
        'max_score',
        'due_at',
        'allow_late_submission',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'max_score' => 'integer',
            'due_at' => 'datetime',
            'allow_late_submission' => 'boolean',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(CourseSection::class, 'course_section_id');
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(CourseLesson::class, 'course_lesson_id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    public function results(): HasMany
    {
        return $this->hasMany(AssignmentResult::class);
    }

    public function analytics(): HasOne
    {
        return $this->hasOne(AssignmentAnalytics::class);
    }
}
