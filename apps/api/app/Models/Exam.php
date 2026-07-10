<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Exam extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'created_by_tenant_user_id',
        'uuid',
        'title',
        'slug',
        'description',
        'category',
        'status',
        'visibility',
        'language',
        'duration',
        'passing_score',
        'total_points',
        'question_count',
        'attempt_limit',
        'shuffle_questions',
        'shuffle_choices',
        'show_results',
        'show_correct_answers',
        'allow_review',
        'negative_marking',
        'certificate_eligible',
        'random_question_pool',
        'pinned',
        'featured',
    ];

    protected $casts = [
        'duration' => 'integer',
        'passing_score' => 'integer',
        'total_points' => 'integer',
        'question_count' => 'integer',
        'attempt_limit' => 'integer',
        'shuffle_questions' => 'boolean',
        'shuffle_choices' => 'boolean',
        'show_results' => 'boolean',
        'show_correct_answers' => 'boolean',
        'allow_review' => 'boolean',
        'negative_marking' => 'boolean',
        'certificate_eligible' => 'boolean',
        'random_question_pool' => 'array',
        'metadata' => 'array',
        'pinned' => 'boolean',
        'featured' => 'boolean',
        'published_at' => 'datetime',
        'archived_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'created_by_tenant_user_id');
    }

    public function examQuestions(): HasMany
    {
        return $this->hasMany(ExamQuestion::class)->orderBy('order');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(ExamQuestion::class)->orderBy('order');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(ExamAttempt::class);
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $model): void {
            if (empty($model->slug)) {
                $model->slug = Str::slug($model->title);
            }
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }
}
