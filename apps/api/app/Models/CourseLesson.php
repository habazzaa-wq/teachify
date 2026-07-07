<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourseLesson extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'course_id',
        'course_section_id',
        'title',
        'slug',
        'short_description',
        'description',
        'type',
        'lesson_type',
        'status',
        'visibility',
        'sort_order',
        'duration_seconds',
        'estimated_duration',
        'free_preview',
        'downloadable',
        'featured',
        'comments_enabled',
        'notes',
        'color',
        'icon',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'duration_seconds' => 'integer',
            'estimated_duration' => 'integer',
            'free_preview' => 'boolean',
            'downloadable' => 'boolean',
            'featured' => 'boolean',
            'comments_enabled' => 'boolean',
            'published_at' => 'datetime',
            'deleted_at' => 'datetime',
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

    public function video(): HasOne
    {
        return $this->hasOne(LessonVideo::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(LessonFile::class);
    }

    public function text(): HasOne
    {
        return $this->hasOne(LessonText::class);
    }

    public function progressRecords(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function notesRelation(): HasMany
    {
        return $this->hasMany(LessonNote::class);
    }

    public function bookmarks(): HasMany
    {
        return $this->hasMany(LessonBookmark::class);
    }

    public function accessRule(): HasOne
    {
        return $this->hasOne(LessonAccessRule::class);
    }

    public function quiz(): HasOne
    {
        return $this->hasOne(Quiz::class);
    }

    public function assignment(): HasOne
    {
        return $this->hasOne(Assignment::class);
    }

    public function discussionThreads(): HasMany
    {
        return $this->hasMany(DiscussionThread::class);
    }
}
