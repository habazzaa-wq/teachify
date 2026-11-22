<?php

namespace App\Services\Certificates;

use App\Models\CertificateApplication;
use App\Models\Course;
use App\Models\CourseCertificateRule;
use App\Models\CourseCompletion;
use App\Models\CourseEnrollment;
use App\Models\IssuedCertificate;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Notifications\NotificationEventService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class CertificateApplicationService
{
    public function __construct(
        private readonly CertificateIssuanceService $issuance,
        private readonly NotificationEventService $notificationEvents,
    ) {
    }

    public function eligibility(CourseEnrollment $enrollment): array
    {
        $enrollment->loadMissing(['course.certificateRule.template', 'completion']);
        $course = $enrollment->course;
        $rule = $course?->certificateRule;
        $completion = $enrollment->completion ?: CourseCompletion::query()
            ->where('course_enrollment_id', $enrollment->id)
            ->first();

        $progress = (int) ($completion?->completion_percent ?? 0);
        $minimum = (int) ($rule?->minimum_completion_percentage ?? 100);
        $enabled = (bool) ($rule?->enabled && $rule?->template && $rule->template->status === 'active');
        $hasIssued = IssuedCertificate::query()
            ->where('tenant_id', $enrollment->tenant_id)
            ->where('course_enrollment_id', $enrollment->id)
            ->where('status', 'issued')
            ->exists();

        $latestApplication = CertificateApplication::query()
            ->where('tenant_id', $enrollment->tenant_id)
            ->where('course_enrollment_id', $enrollment->id)
            ->latest('id')
            ->first();

        $canApply = $enabled
            && ! $hasIssued
            && $progress >= $minimum
            && ! $latestApplication?->status || ! in_array($latestApplication->status, [CertificateApplication::STATUS_PENDING, CertificateApplication::STATUS_APPROVED, CertificateApplication::STATUS_ISSUED], true);

        // If no application exists, canApply depends on eligibility only
        if ($latestApplication === null) {
            $canApply = $enabled && ! $hasIssued && $progress >= $minimum;
        } else {
            $canApply = $enabled
                && ! $hasIssued
                && $progress >= $minimum
                && in_array($latestApplication->status, [CertificateApplication::STATUS_REJECTED, CertificateApplication::STATUS_CANCELLED], true);
        }

        return [
            'enabled' => $enabled,
            'has_issued_certificate' => $hasIssued,
            'progress_percent' => $progress,
            'minimum_completion_percentage' => $minimum,
            'can_apply' => $canApply,
            'rule' => $rule ? [
                'id' => $rule->id,
                'enabled' => $rule->enabled,
                'minimum_completion_percentage' => $rule->minimum_completion_percentage,
                'template' => $rule->template ? [
                    'id' => $rule->template->id,
                    'name' => $rule->template->name,
                    'status' => $rule->template->status,
                ] : null,
            ] : null,
            'latest_application' => $latestApplication ? $this->serializeApplication($latestApplication) : null,
            'issued_certificate' => $hasIssued ? IssuedCertificate::query()
                ->where('tenant_id', $enrollment->tenant_id)
                ->where('course_enrollment_id', $enrollment->id)
                ->where('status', 'issued')
                ->with(['template', 'verification'])
                ->latest('issued_at')
                ->first() : null,
        ];
    }

    public function apply(CourseEnrollment $enrollment, TenantUser $student, ?string $note = null): CertificateApplication
    {
        $enrollment->loadMissing(['course.certificateRule.template', 'completion', 'tenant']);
        $rule = $enrollment->course?->certificateRule;
        $completion = $enrollment->completion ?: CourseCompletion::query()
            ->where('course_enrollment_id', $enrollment->id)
            ->first();
        $progress = (int) ($completion?->completion_percent ?? 0);

        if (! $rule || ! $rule->enabled || ! $rule->template || $rule->template->status !== 'active') {
            throw ValidationException::withMessages(['certificate' => ['الشهادات غير مفعّلة لهذه الدورة حالياً.']]);
        }

        $minimum = (int) ($rule->minimum_completion_percentage ?? 100);
        if ($progress < $minimum) {
            throw ValidationException::withMessages(['certificate' => ["يجب الوصول إلى {$minimum}% على الأقل للتقديم على الشهادة."]]);
        }

        $existingIssued = IssuedCertificate::query()
            ->where('tenant_id', $enrollment->tenant_id)
            ->where('course_enrollment_id', $enrollment->id)
            ->where('status', 'issued')
            ->exists();
        if ($existingIssued) {
            throw ValidationException::withMessages(['certificate' => ['تم إصدار شهادة لهذه الدورة بالفعل.']]);
        }

        $openApplication = CertificateApplication::query()
            ->where('tenant_id', $enrollment->tenant_id)
            ->where('course_enrollment_id', $enrollment->id)
            ->whereIn('status', [CertificateApplication::STATUS_PENDING, CertificateApplication::STATUS_APPROVED, CertificateApplication::STATUS_ISSUED])
            ->latest('id')
            ->first();
        if ($openApplication) {
            throw ValidationException::withMessages(['certificate' => ['لديك طلب شهادة قائم بالفعل لهذه الدورة.']]);
        }

        $application = CertificateApplication::create([
            'tenant_id' => $enrollment->tenant_id,
            'course_id' => $enrollment->course_id,
            'course_enrollment_id' => $enrollment->id,
            'tenant_user_id' => $student->id,
            'course_certificate_rule_id' => $rule->id,
            'certificate_template_id' => $rule->certificate_template_id,
            'status' => CertificateApplication::STATUS_PENDING,
            'progress_percent_at_apply' => $progress,
            'applied_at' => now(),
            'student_note' => $note,
        ]);

        $this->notificationEvents->record($enrollment->tenant, 'certificate.application.submitted', 'certificate-application-'.$application->id, [
            'tenant_user_id' => $student->id,
            'course_id' => $enrollment->course_id,
            'course_title' => $enrollment->course?->title,
            'application_id' => $application->id,
        ]);

        return $application->refresh()->load(['course', 'student.user', 'template', 'issuedCertificate.verification', 'reviewer.user']);
    }

    public function listForTenant(Tenant $tenant, array $filters = []): LengthAwarePaginator
    {
        $query = CertificateApplication::query()
            ->with(['course', 'student.user', 'template', 'issuedCertificate.verification', 'reviewer.user', 'enrollment.completion'])
            ->where('tenant_id', $tenant->id);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['course_id'])) {
            $query->where('course_id', $filters['course_id']);
        }
        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function (Builder $builder) use ($search) {
                $builder->whereHas('student.user', fn (Builder $q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                    ->orWhereHas('course', fn (Builder $q) => $q->where('title', 'like', "%{$search}%"));
            });
        }

        return $query->latest('applied_at')->latest('id')->paginate(25)->withQueryString();
    }

    public function listForStudent(Tenant $tenant, TenantUser $student): \Illuminate\Support\Collection
    {
        return CertificateApplication::query()
            ->with(['course', 'template', 'issuedCertificate.verification', 'reviewer.user'])
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $student->id)
            ->latest('id')
            ->get();
    }

    public function approve(CertificateApplication $application, TenantUser $reviewer, ?string $note = null, bool $issueAndSend = true): CertificateApplication
    {
        $this->assertReviewable($application);

        $application->forceFill([
            'status' => CertificateApplication::STATUS_APPROVED,
            'reviewed_at' => now(),
            'reviewed_by_tenant_user_id' => $reviewer->id,
            'admin_note' => $note,
        ])->save();

        if ($issueAndSend) {
            $application = $this->issueForApplication($application->refresh(), $reviewer);
        }

        $this->notificationEvents->record($application->tenant, 'certificate.application.approved', 'certificate-application-'.$application->id, [
            'tenant_user_id' => $application->tenant_user_id,
            'course_id' => $application->course_id,
            'course_title' => $application->course?->title,
            'application_id' => $application->id,
        ]);

        return $application->refresh()->load(['course', 'student.user', 'template', 'issuedCertificate.verification', 'reviewer.user']);
    }

    public function reject(CertificateApplication $application, TenantUser $reviewer, ?string $note = null): CertificateApplication
    {
        $this->assertReviewable($application);

        $application->forceFill([
            'status' => CertificateApplication::STATUS_REJECTED,
            'reviewed_at' => now(),
            'reviewed_by_tenant_user_id' => $reviewer->id,
            'admin_note' => $note,
        ])->save();

        $this->notificationEvents->record($application->tenant, 'certificate.application.rejected', 'certificate-application-'.$application->id, [
            'tenant_user_id' => $application->tenant_user_id,
            'course_id' => $application->course_id,
            'course_title' => $application->course?->title,
            'application_id' => $application->id,
        ]);

        return $application->refresh()->load(['course', 'student.user', 'template', 'issuedCertificate.verification', 'reviewer.user']);
    }

    public function issueForApplication(CertificateApplication $application, TenantUser $reviewer): CertificateApplication
    {
        $application->loadMissing(['enrollment.completion', 'course', 'student.user', 'template', 'tenant']);

        if ($application->issued_certificate_id && $application->issuedCertificate?->status === 'issued') {
            if ($application->status !== CertificateApplication::STATUS_ISSUED) {
                $application->forceFill(['status' => CertificateApplication::STATUS_ISSUED, 'sent_at' => $application->sent_at ?? now()])->save();
            }
            return $application->refresh();
        }

        $completion = $application->enrollment?->completion ?: CourseCompletion::query()
            ->where('course_enrollment_id', $application->course_enrollment_id)
            ->first();

        if (! $completion) {
            throw ValidationException::withMessages(['certificate' => ['لم يتم العثور على سجل إكمال لهذه الدورة.']]);
        }

        $certificate = $this->issuance->issueForApplication($application, $completion, $reviewer);

        $application->forceFill([
            'status' => CertificateApplication::STATUS_ISSUED,
            'issued_certificate_id' => $certificate->id,
            'reviewed_by_tenant_user_id' => $application->reviewed_by_tenant_user_id ?: $reviewer->id,
            'reviewed_at' => $application->reviewed_at ?: now(),
            'sent_at' => now(),
        ])->save();

        $this->notificationEvents->record($application->tenant, 'certificate.issued', 'certificate-application-issued-'.$application->id, [
            'tenant_user_id' => $application->tenant_user_id,
            'course_id' => $application->course_id,
            'course_title' => $application->course?->title,
            'certificate_id' => $certificate->id,
            'application_id' => $application->id,
        ]);

        return $application->refresh()->load(['course', 'student.user', 'template', 'issuedCertificate.verification', 'reviewer.user']);
    }

    private function assertReviewable(CertificateApplication $application): void
    {
        if (! in_array($application->status, [CertificateApplication::STATUS_PENDING, CertificateApplication::STATUS_APPROVED], true)) {
            throw ValidationException::withMessages(['status' => ['لا يمكن مراجعة هذا الطلب في حالته الحالية.']]);
        }
    }

    private function serializeApplication(CertificateApplication $application): array
    {
        return [
            'id' => $application->id,
            'status' => $application->status,
            'progress_percent_at_apply' => $application->progress_percent_at_apply,
            'applied_at' => $application->applied_at,
            'reviewed_at' => $application->reviewed_at,
            'sent_at' => $application->sent_at,
            'admin_note' => $application->admin_note,
            'issued_certificate_id' => $application->issued_certificate_id,
        ];
    }
}
