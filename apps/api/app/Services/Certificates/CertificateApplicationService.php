<?php

namespace App\Services\Certificates;

use App\Models\CertificateApplication;
use App\Models\CertificateRequirement;
use App\Models\CourseCompletion;
use App\Models\CourseEnrollment;
use App\Models\IssuedCertificate;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Notifications\NotificationEventService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class CertificateApplicationService
{
    public function __construct(
        private readonly CertificateIssuanceService $issuance,
        private readonly NotificationEventService $notificationEvents,
        private readonly CertificateEligibilityService $eligibility,
        private readonly CertificateRuleService $rules,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function eligibility(CourseEnrollment $enrollment): array
    {
        $evaluation = $this->eligibility->evaluate($enrollment);
        $rule = $enrollment->course?->certificateRule;

        return array_merge($evaluation, [
            'rule' => $rule ? $this->rules->serialize($rule) : null,
            'issued_certificate' => $evaluation['has_issued_certificate'] ? IssuedCertificate::query()
                ->where('tenant_id', $enrollment->tenant_id)
                ->where('course_id', $enrollment->course_id)
                ->where('tenant_user_id', $enrollment->tenant_user_id)
                ->where('status', 'issued')
                ->with(['template', 'verification'])
                ->latest('issued_at')
                ->first() : null,
        ]);
    }

    /**
     * @param  array<string, string>  $submissions  requirement id => URL
     */
    public function apply(
        CourseEnrollment $enrollment,
        TenantUser $student,
        ?string $note = null,
        array $submissions = [],
    ): CertificateApplication {
        $enrollment->loadMissing(['course.certificateRule.requirements', 'tenant']);
        $rule = $enrollment->course?->certificateRule;

        if (! $rule || ! $rule->enabled || ! $rule->template || $rule->template->status !== 'active') {
            throw ValidationException::withMessages(['certificate' => ['الشهادات غير مفعّلة لهذه الدورة حالياً.']]);
        }

        $cleanSubmissions = $this->validateSubmissions($rule->requirements, $submissions);
        $evaluation = $this->eligibility->evaluate($enrollment, $cleanSubmissions);

        if (! $evaluation['completion_met']) {
            throw ValidationException::withMessages(['certificate' => ["يجب الوصول إلى {$evaluation['minimum_completion_percentage']}% على الأقل للتقديم على الشهادة."]]);
        }

        if (! $evaluation['all_requirements_met'] || ! $evaluation['legacy_requirements_met']) {
            throw ValidationException::withMessages(['certificate' => ['لم تستوفِ متطلبات الشهادة بعد (الاختبار/المشروع).']]);
        }

        if ($evaluation['has_issued_certificate']) {
            throw ValidationException::withMessages(['certificate' => ['تم إصدار شهادة لهذه الدورة بالفعل.']]);
        }

        if ($evaluation['latest_application'] && in_array($evaluation['latest_application'], [
            CertificateApplication::STATUS_PENDING,
            CertificateApplication::STATUS_APPROVED,
            CertificateApplication::STATUS_ISSUED,
        ], true)) {
            throw ValidationException::withMessages(['certificate' => ['لديك طلب شهادة قائم بالفعل لهذه الدورة.']]);
        }

        $completion = $enrollment->completion ?: CourseCompletion::query()
            ->where('course_enrollment_id', $enrollment->id)
            ->first();

        $application = CertificateApplication::create([
            'tenant_id' => $enrollment->tenant_id,
            'course_id' => $enrollment->course_id,
            'course_enrollment_id' => $enrollment->id,
            'tenant_user_id' => $student->id,
            'course_certificate_rule_id' => $rule->id,
            'certificate_template_id' => $rule->certificate_template_id,
            'status' => CertificateApplication::STATUS_PENDING,
            'progress_percent_at_apply' => (int) ($completion?->completion_percent ?? 0),
            'applied_at' => now(),
            'student_note' => $note,
            'submissions' => $cleanSubmissions,
            'metadata' => [
                'requirement_snapshot' => $rule->requirements->map(fn (CertificateRequirement $requirement) => [
                    'id' => $requirement->id,
                    'type' => $requirement->type,
                    'title' => $requirement->title,
                    'required_score' => $requirement->required_score,
                ])->all(),
            ],
        ]);

        $this->notificationEvents->record($enrollment->tenant, 'certificate.application.submitted', 'certificate-application-'.$application->id, [
            'tenant_user_id' => $student->id,
            'course_id' => $enrollment->course_id,
            'course_title' => $enrollment->course?->title,
            'application_id' => $application->id,
        ]);

        return $application->refresh()->load(['course', 'student.user', 'template', 'issuedCertificate.verification', 'reviewer.user']);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listForTenant(Tenant $tenant, array $filters = [], ?TenantUser $instructor = null): LengthAwarePaginator
    {
        $query = CertificateApplication::query()
            ->with(['course', 'student.user', 'template', 'issuedCertificate.verification', 'reviewer.user', 'enrollment.completion'])
            ->where('tenant_id', $tenant->id);

        if ($instructor) {
            $query->whereHas('course', function (Builder $builder) use ($instructor): void {
                $builder->where('created_by_tenant_user_id', $instructor->id)
                    ->orWhere('primary_instructor_tenant_user_id', $instructor->id)
                    ->orWhereHas('instructors', fn (Builder $q) => $q->where('tenant_user_id', $instructor->id));
            });
        }

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

    public function listForStudent(Tenant $tenant, TenantUser $student): Collection
    {
        return CertificateApplication::query()
            ->with(['course', 'template', 'issuedCertificate.verification', 'reviewer.user'])
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $student->id)
            ->latest('id')
            ->get();
    }

    /**
     * @param  array<string, array{status: string, note?: string}>  $reviews
     */
    public function approve(
        CertificateApplication $application,
        TenantUser $reviewer,
        ?string $note = null,
        bool $issueAndSend = true,
        array $reviews = [],
    ): CertificateApplication {
        $this->assertReviewable($application);

        $evaluation = $this->eligibility->evaluate($application->enrollment, $application->submissions ?? []);
        if (! $evaluation['completion_met'] || ! $evaluation['all_requirements_met'] || ! $evaluation['legacy_requirements_met']) {
            throw ValidationException::withMessages(['certificate' => ['لم يستوفِ الطالب متطلبات الشهادة، لا يمكن الاعتماد.']]);
        }

        $normalizedReviews = [];
        foreach ($evaluation['requirements'] as $requirement) {
            $review = $reviews[(string) $requirement['id']] ?? null;
            $status = is_array($review) ? ($review['status'] ?? 'approved') : 'approved';

            if (! in_array($status, ['approved', 'rejected'], true)) {
                throw ValidationException::withMessages(['requirement_reviews' => ['Invalid requirement review status.']]);
            }

            $normalizedReviews[(string) $requirement['id']] = [
                'status' => $status,
                'note' => is_array($review) ? ($review['note'] ?? null) : null,
                'reviewed_by_tenant_user_id' => $reviewer->id,
                'reviewed_at' => now()->toIso8601String(),
            ];
        }

        if (collect($normalizedReviews)->contains(fn (array $review): bool => $review['status'] === 'rejected')) {
            $application->forceFill([
                'status' => CertificateApplication::STATUS_REJECTED,
                'reviewed_at' => now(),
                'reviewed_by_tenant_user_id' => $reviewer->id,
                'admin_note' => $note ?: 'أحد متطلبات الشهادة لم يجتز المراجعة.',
                'requirement_reviews' => $normalizedReviews,
            ])->save();

            $this->notificationEvents->record($application->tenant, 'certificate.application.rejected', 'certificate-application-'.$application->id, [
                'tenant_user_id' => $application->tenant_user_id,
                'course_id' => $application->course_id,
                'course_title' => $application->course?->title,
                'application_id' => $application->id,
            ]);

            return $application->refresh()->load(['course', 'student.user', 'template', 'issuedCertificate.verification', 'reviewer.user']);
        }

        $application->forceFill([
            'status' => CertificateApplication::STATUS_APPROVED,
            'reviewed_at' => now(),
            'reviewed_by_tenant_user_id' => $reviewer->id,
            'admin_note' => $note,
            'requirement_reviews' => $normalizedReviews,
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

    /**
     * @param  array<string, string>  $submissions
     * @return array<string, string>
     */
    private function validateSubmissions(mixed $requirements, array $submissions): array
    {
        $allowed = collect(is_iterable($requirements) ? $requirements : [])
            ->map(fn ($requirement) => (string) $requirement->id)
            ->all();

        $clean = [];
        foreach ($submissions as $id => $url) {
            $id = (string) $id;
            if (! in_array($id, $allowed, true) || ! is_string($url) || trim($url) === '') {
                continue;
            }
            if (! filter_var($url, FILTER_VALIDATE_URL)) {
                throw ValidationException::withMessages(['submissions' => ['One of the submitted links is invalid.']]);
            }
            $clean[$id] = trim($url);
        }

        return $clean;
    }

    private function assertReviewable(CertificateApplication $application): void
    {
        if (! in_array($application->status, [CertificateApplication::STATUS_PENDING, CertificateApplication::STATUS_APPROVED], true)) {
            throw ValidationException::withMessages(['status' => ['لا يمكن مراجعة هذا الطلب في حالته الحالية.']]);
        }
    }

    /**
     * @return array<string, mixed>
     */
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
            'submissions' => $application->submissions,
            'requirement_reviews' => $application->requirement_reviews,
        ];
    }
}
