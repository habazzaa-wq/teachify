<?php

namespace App\Models;

use Database\Factories\TenantUserFactory;
use App\Services\Authorization\AuthorizationService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class TenantUser extends Model
{
    /** @use HasFactory<TenantUserFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'status',
        'phone',
        'avatar',
        'locale',
        'timezone',
        'department',
        'job_title',
        'notes',
        'joined_at',
        'last_accessed_at',
        'last_login_at',
        'last_login_ip',
    ];

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
            'last_accessed_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    public function can($ability, $arguments = []): bool
    {
        if (is_string($ability)) {
            return app(AuthorizationService::class)->can($this->user, $ability);
        }

        return false;
    }

    public function cannot($ability, $arguments = []): bool
    {
        return ! $this->can($ability, $arguments);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_tenant_user')
            ->withPivot(['tenant_id'])
            ->withTimestamps();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'created_by_tenant_user_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'updated_by_tenant_user_id');
    }

    public function createdCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'created_by_tenant_user_id');
    }

    public function primaryInstructorCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'primary_instructor_tenant_user_id');
    }

    public function courseInstructorAssignments(): HasMany
    {
        return $this->hasMany(CourseInstructor::class);
    }

    public function createdMediaAssets(): HasMany
    {
        return $this->hasMany(MediaAsset::class, 'created_by_tenant_user_id');
    }

    public function mediaUploadSessions(): HasMany
    {
        return $this->hasMany(MediaUploadSession::class, 'created_by_tenant_user_id');
    }

    public function courseEnrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class);
    }

    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function quizResults(): HasMany
    {
        return $this->hasMany(QuizResult::class);
    }

    public function assignmentSubmissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    public function assignmentResults(): HasMany
    {
        return $this->hasMany(AssignmentResult::class);
    }

    public function gradedAssignmentResults(): HasMany
    {
        return $this->hasMany(AssignmentResult::class, 'graded_by_tenant_user_id');
    }

    public function issuedCertificates(): HasMany
    {
        return $this->hasMany(IssuedCertificate::class);
    }

    public function analytics(): HasOne
    {
        return $this->hasOne(LearnerAnalytics::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function notificationPreferences(): HasMany
    {
        return $this->hasMany(NotificationPreference::class);
    }

    public function discussionThreads(): HasMany
    {
        return $this->hasMany(DiscussionThread::class, 'created_by_tenant_user_id');
    }

    public function discussionPosts(): HasMany
    {
        return $this->hasMany(DiscussionPost::class);
    }

    public function discussionParticipants(): HasMany
    {
        return $this->hasMany(DiscussionParticipant::class);
    }

    public function filedDiscussionReports(): HasMany
    {
        return $this->hasMany(DiscussionReport::class, 'reported_by_tenant_user_id');
    }

    public function reviewedDiscussionReports(): HasMany
    {
        return $this->hasMany(DiscussionReport::class, 'reviewed_by_tenant_user_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }
}
