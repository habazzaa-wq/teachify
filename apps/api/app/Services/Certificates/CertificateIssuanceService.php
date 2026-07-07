<?php

namespace App\Services\Certificates;

use App\Models\Assignment;
use App\Models\AssignmentResult;
use App\Models\CertificateVerification;
use App\Models\CourseCompletion;
use App\Models\IssuedCertificate;
use App\Models\Quiz;
use App\Models\QuizResult;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Services\Notifications\NotificationEventService;

class CertificateIssuanceService
{
    public function __construct(private readonly NotificationEventService $notificationEvents)
    {
    }

    public function evaluateAndIssue(CourseCompletion $completion): ?IssuedCertificate
    {
        $completion->loadMissing(['course.certificateRule.template', 'enrollment.student.user']);
        $rule = $completion->course->certificateRule;

        if (! $rule || ! $rule->enabled || ! $rule->template || $rule->template->status !== 'active') {
            return null;
        }

        if (! $this->isEligible($completion)) {
            return null;
        }

        return $this->issue($completion);
    }

    public function revoke(IssuedCertificate $certificate): IssuedCertificate
    {
        if ($certificate->status !== 'revoked') {
            $certificate->forceFill(['status' => 'revoked'])->save();
        }

        return $certificate->refresh()->load(['course', 'student.user', 'template', 'verification']);
    }

    private function isEligible(CourseCompletion $completion): bool
    {
        $rule = $completion->course->certificateRule;

        if ($rule->require_course_completion) {
            if ($completion->completion_percent < $rule->minimum_completion_percentage || ! $completion->completed_at) {
                return false;
            }
        } elseif ($completion->completion_percent < $rule->minimum_completion_percentage) {
            return false;
        }

        if ($rule->require_quiz_pass && ! $this->hasPassedRequiredQuizzes($completion)) {
            return false;
        }

        if ($rule->require_assignment_pass && ! $this->hasPassedRequiredAssignments($completion)) {
            return false;
        }

        return true;
    }

    private function issue(CourseCompletion $completion): IssuedCertificate
    {
        $existing = IssuedCertificate::query()
            ->where('course_id', $completion->course_id)
            ->where('tenant_user_id', $completion->enrollment->tenant_user_id)
            ->first();

        if ($existing) {
            return $existing->load(['course', 'student.user', 'template', 'verification']);
        }

        $certificate = DB::transaction(function () use ($completion): IssuedCertificate {
            $rule = $completion->course->certificateRule;
            $certificate = IssuedCertificate::create([
                'tenant_id' => $completion->tenant_id,
                'course_id' => $completion->course_id,
                'course_completion_id' => $completion->id,
                'tenant_user_id' => $completion->enrollment->tenant_user_id,
                'certificate_template_id' => $rule->certificate_template_id,
                'certificate_number' => $this->certificateNumber(),
                'issued_at' => now(),
                'status' => 'issued',
                'metadata' => [
                    'completion_percent' => $completion->completion_percent,
                    'rule_id' => $rule->id,
                ],
            ]);

            CertificateVerification::create([
                'tenant_id' => $certificate->tenant_id,
                'issued_certificate_id' => $certificate->id,
                'verification_code' => $this->verificationCode(),
                'verified_at' => null,
            ]);

            return $certificate->refresh()->load(['course', 'student.user', 'template', 'verification']);
        });

        $this->notificationEvents->record($certificate->course->tenant, 'certificate.issued', 'certificate-issued-'.$certificate->id, [
            'tenant_user_id' => $certificate->tenant_user_id,
            'course_id' => $certificate->course_id,
            'course_title' => $certificate->course->title,
            'certificate_id' => $certificate->id,
        ]);

        return $certificate;
    }

    private function hasPassedRequiredQuizzes(CourseCompletion $completion): bool
    {
        $quizIds = Quiz::query()
            ->where('course_id', $completion->course_id)
            ->where('status', 'published')
            ->pluck('id');

        if ($quizIds->isEmpty()) {
            return false;
        }

        $passedCount = QuizResult::query()
            ->where('tenant_user_id', $completion->enrollment->tenant_user_id)
            ->whereIn('quiz_id', $quizIds->all())
            ->where('passed', true)
            ->count();

        return $passedCount === $quizIds->count();
    }

    private function hasPassedRequiredAssignments(CourseCompletion $completion): bool
    {
        $assignmentIds = Assignment::query()
            ->where('course_id', $completion->course_id)
            ->where('status', 'published')
            ->pluck('id');

        if ($assignmentIds->isEmpty()) {
            return false;
        }

        $passedCount = AssignmentResult::query()
            ->where('tenant_user_id', $completion->enrollment->tenant_user_id)
            ->whereIn('assignment_id', $assignmentIds->all())
            ->where('passed', true)
            ->count();

        return $passedCount === $assignmentIds->count();
    }

    private function certificateNumber(): string
    {
        do {
            $number = 'CERT-'.now()->format('Y').'-'.Str::upper(substr((string) Str::uuid(), 0, 8));
        } while (IssuedCertificate::withoutGlobalScopes()->where('certificate_number', $number)->exists());

        return $number;
    }

    private function verificationCode(): string
    {
        do {
            $code = Str::upper(Str::random(32));
        } while (CertificateVerification::withoutGlobalScopes()->where('verification_code', $code)->exists());

        return $code;
    }
}
