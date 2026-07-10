<?php

namespace App\Models;

use App\Models\Usage\TenantUsage;
use App\Models\Usage\TenantUsageHistory;
use App\Models\Usage\TenantUsageSnapshot;
use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Tenant extends Model
{
    /** @use HasFactory<TenantFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'status',
        'description',
        'phone',
        'timezone',
        'language',
        'currency',
        'company_name',
        'support_email',
        'notes',
        'tags',
        'address',
        'owner',
        'owner_account',
        'branding',
        'limits',
        'integrations_json',
        'security',
        'storage_json',
        'subscription',
        'plan',
        'feature_flags',
    ];

    protected function casts(): array
    {
        return [
            'subscription' => 'array',
            'plan' => 'array',
            'feature_flags' => 'array',
            'tags' => 'array',
            'address' => 'array',
            'owner' => 'array',
            'owner_account' => 'array',
            'branding' => 'array',
            'limits' => 'array',
            'integrations_json' => 'array',
            'security' => 'array',
            'storage_json' => 'array',
        ];
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(TenantUser::class);
    }

    public function roles(): HasMany
    {
        return $this->hasMany(Role::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(TenantInvitation::class);
    }

    public function settings(): HasMany
    {
        return $this->hasMany(TenantSetting::class);
    }

    public function domains(): HasMany
    {
        return $this->hasMany(TenantDomain::class);
    }

    public function integrations(): HasMany
    {
        return $this->hasMany(TenantIntegration::class);
    }

    public function provisioningSteps(): HasMany
    {
        return $this->hasMany(TenantProvisioningStep::class);
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function tags(): HasMany
    {
        return $this->hasMany(Tag::class);
    }

    public function mediaCollections(): HasMany
    {
        return $this->hasMany(MediaCollection::class);
    }

    public function mediaAssets(): HasMany
    {
        return $this->hasMany(MediaAsset::class);
    }

    public function mediaUploadSessions(): HasMany
    {
        return $this->hasMany(MediaUploadSession::class);
    }

    public function courseEnrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class);
    }

    public function lessonProgressRecords(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function courseCompletions(): HasMany
    {
        return $this->hasMany(CourseCompletion::class);
    }

    public function courseAccessRules(): HasMany
    {
        return $this->hasMany(CourseAccessRule::class);
    }

    public function lessonAccessRules(): HasMany
    {
        return $this->hasMany(LessonAccessRule::class);
    }

    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class);
    }

    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function quizResults(): HasMany
    {
        return $this->hasMany(QuizResult::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function assignmentSubmissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    public function assignmentResults(): HasMany
    {
        return $this->hasMany(AssignmentResult::class);
    }

    public function certificateTemplates(): HasMany
    {
        return $this->hasMany(CertificateTemplate::class);
    }

    public function courseCertificateRules(): HasMany
    {
        return $this->hasMany(CourseCertificateRule::class);
    }

    public function issuedCertificates(): HasMany
    {
        return $this->hasMany(IssuedCertificate::class);
    }

    public function analyticsSnapshots(): HasMany
    {
        return $this->hasMany(AnalyticsSnapshot::class);
    }

    public function courseAnalytics(): HasMany
    {
        return $this->hasMany(CourseAnalytics::class);
    }

    public function learnerAnalytics(): HasMany
    {
        return $this->hasMany(LearnerAnalytics::class);
    }

    public function quizAnalytics(): HasMany
    {
        return $this->hasMany(QuizAnalytics::class);
    }

    public function assignmentAnalytics(): HasMany
    {
        return $this->hasMany(AssignmentAnalytics::class);
    }

    public function videoAnalytics(): HasMany
    {
        return $this->hasMany(VideoAnalytics::class);
    }

    public function analyticsJobs(): HasMany
    {
        return $this->hasMany(AnalyticsJob::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function notificationTemplates(): HasMany
    {
        return $this->hasMany(NotificationTemplate::class);
    }

    public function notificationPreferences(): HasMany
    {
        return $this->hasMany(NotificationPreference::class);
    }

    public function notificationDeliveries(): HasMany
    {
        return $this->hasMany(NotificationDelivery::class);
    }

    public function notificationEvents(): HasMany
    {
        return $this->hasMany(NotificationEvent::class);
    }

    public function discussionThreads(): HasMany
    {
        return $this->hasMany(DiscussionThread::class);
    }

    public function discussionPosts(): HasMany
    {
        return $this->hasMany(DiscussionPost::class);
    }

    public function discussionParticipants(): HasMany
    {
        return $this->hasMany(DiscussionParticipant::class);
    }

    public function discussionReports(): HasMany
    {
        return $this->hasMany(DiscussionReport::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function getPrimaryDomain(): ?TenantDomain
    {
        return $this->domains()->where('is_primary', true)->first();
    }

    public function isPrimaryDomain(TenantDomain $domain): bool
    {
        return $domain->is_primary && $domain->tenant_id === $this->id;
    }

    public function matchesDomain(string $hostname): bool
    {
        return Cache::remember("tenant.{$this->id}.domain_match.".$hostname, 3600, function () use ($hostname): bool {
            return $this->domains()
                ->where('domain', $hostname)
                ->where('status', 'active')
                ->exists();
        });
    }

    public function getDefaultDomain(): string
    {
        $primary = $this->getPrimaryDomain();

        return $primary?->domain ?? $this->slug.'.'.config('app.base_domain', 'localhost');
    }

    public function usage(): HasMany
    {
        return $this->hasMany(TenantUsage::class);
    }

    public function usageHistory(): HasMany
    {
        return $this->hasMany(TenantUsageHistory::class);
    }

    public function usageSnapshots(): HasMany
    {
        return $this->hasMany(TenantUsageSnapshot::class);
    }
}
