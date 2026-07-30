<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'created_by_tenant_user_id',
        'primary_instructor_tenant_user_id',
        'title',
        'slug',
        'subtitle',
        'short_description',
        'description',
        'full_description',
        'thumbnail_path',
        'cover_image_path',
        'status',
        'visibility',
        'difficulty',
        'language',
        'duration',
        'pricing_type',
        'price_amount',
        'price_currency',
        'discount_price',
        'enrollment_limit',
        'start_date',
        'end_date',
        'certificate_enabled',
        'featured',
        'seo_title',
        'seo_description',
        'seo_keywords',
        'requirements',
        'learning_outcomes',
        'target_audience',
        'educational_stage_id',
        'subject_id',
        'published_at',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'price_amount' => 'integer',
            'discount_price' => 'integer',
            'duration' => 'integer',
            'enrollment_limit' => 'integer',
            'certificate_enabled' => 'boolean',
            'featured' => 'boolean',
            'requirements' => 'array',
            'learning_outcomes' => 'array',
            'target_audience' => 'array',
            'deleted_at' => 'datetime',
            'published_at' => 'datetime',
            'archived_at' => 'datetime',
            'start_date' => 'datetime',
            'end_date' => 'datetime',
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

    public function primaryInstructor(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'primary_instructor_tenant_user_id');
    }

    public function instructors(): HasMany
    {
        return $this->hasMany(CourseInstructor::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'course_categories')
            ->withPivot(['tenant_id'])
            ->withTimestamps();
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'course_tags')
            ->withPivot(['tenant_id'])
            ->withTimestamps();
    }

    public function settings(): HasMany
    {
        return $this->hasMany(CourseSetting::class);
    }

    public function modules(): HasMany
    {
        return $this->hasMany(CourseModule::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(CourseSection::class);
    }

    public function sectionsWithLessonsCount(): HasMany
    {
        return $this->hasMany(CourseSection::class)->withCount('lessons');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(CourseLesson::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class);
    }

    public function progressRecords(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function completions(): HasMany
    {
        return $this->hasMany(CourseCompletion::class);
    }

    public function accessRule(): HasOne
    {
        return $this->hasOne(CourseAccessRule::class);
    }

    public function lessonAccessRules(): HasMany
    {
        return $this->hasMany(LessonAccessRule::class);
    }

    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function certificateRule(): HasOne
    {
        return $this->hasOne(CourseCertificateRule::class);
    }

    public function issuedCertificates(): HasMany
    {
        return $this->hasMany(IssuedCertificate::class);
    }

    public function analytics(): HasOne
    {
        return $this->hasOne(CourseAnalytics::class);
    }

    public function discussionThreads(): HasMany
    {
        return $this->hasMany(DiscussionThread::class);
    }

    public function educationalStage(): BelongsTo
    {
        return $this->belongsTo(EducationalStage::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }
}
