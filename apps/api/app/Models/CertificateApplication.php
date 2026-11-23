<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CertificateApplication extends Model
{
    use BelongsToTenant;

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_ISSUED = 'issued';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'tenant_id',
        'course_id',
        'course_enrollment_id',
        'tenant_user_id',
        'course_certificate_rule_id',
        'certificate_template_id',
        'issued_certificate_id',
        'reviewed_by_tenant_user_id',
        'status',
        'progress_percent_at_apply',
        'applied_at',
        'reviewed_at',
        'sent_at',
        'student_note',
        'submissions',
        'requirement_reviews',
        'admin_note',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'progress_percent_at_apply' => 'integer',
            'applied_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'sent_at' => 'datetime',
            'metadata' => 'array',
            'submissions' => 'array',
            'requirement_reviews' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(CourseEnrollment::class, 'course_enrollment_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'tenant_user_id');
    }

    public function rule(): BelongsTo
    {
        return $this->belongsTo(CourseCertificateRule::class, 'course_certificate_rule_id');
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(CertificateTemplate::class, 'certificate_template_id');
    }

    public function issuedCertificate(): BelongsTo
    {
        return $this->belongsTo(IssuedCertificate::class, 'issued_certificate_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'reviewed_by_tenant_user_id');
    }
}
