<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiscussionThread extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'created_by_tenant_user_id',
        'course_id',
        'course_section_id',
        'course_lesson_id',
        'title',
        'type',
        'status',
        'is_pinned',
        'is_locked',
        'last_activity_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'is_pinned' => 'boolean',
            'is_locked' => 'boolean',
            'last_activity_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'created_by_tenant_user_id');
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

    public function posts(): HasMany
    {
        return $this->hasMany(DiscussionPost::class, 'discussion_thread_id');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(DiscussionParticipant::class, 'discussion_thread_id');
    }

    public function reports(): HasMany
    {
        return $this->hasManyThrough(
            DiscussionReport::class,
            DiscussionPost::class,
            'discussion_thread_id',
            'discussion_post_id',
        );
    }

    public function isGeneral(): bool
    {
        return $this->type === 'general';
    }

    public function isArchived(): bool
    {
        return $this->status === 'archived';
    }
}
