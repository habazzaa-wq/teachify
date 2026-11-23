<?php

namespace App\Services\Certificates;

use App\Models\Assignment;
use App\Models\AssignmentResult;
use App\Models\CertificateApplication;
use App\Models\CertificateRequirement;
use App\Models\CourseCertificateRule;
use App\Models\CourseCompletion;
use App\Models\CourseEnrollment;
use App\Models\ExamAttempt;
use App\Models\IssuedCertificate;
use App\Models\Quiz;
use App\Models\QuizResult;

class CertificateEligibilityService
{
    /**
     * @param  array<string, string>|null  $submissions  requirement id => submitted URL
     * @return array<string, mixed>
     */
    public function evaluate(CourseEnrollment $enrollment, ?array $submissions = null): array
    {
        $enrollment->loadMissing(['course.certificateRule.requirements.exam', 'completion', 'student']);

        $course = $enrollment->course;
        $rule = $course?->certificateRule;
        $completion = $enrollment->completion ?: CourseCompletion::query()
            ->where('course_enrollment_id', $enrollment->id)
            ->first();

        $progress = (int) ($completion?->completion_percent ?? 0);
        $minimum = (int) ($rule?->minimum_completion_percentage ?? 100);
        $enabled = (bool) ($rule?->enabled && $rule?->template && $rule->template->status === 'active');

        $latestApplication = CertificateApplication::query()
            ->where('tenant_id', $enrollment->tenant_id)
            ->where('course_enrollment_id', $enrollment->id)
            ->latest('id')
            ->first();

        if ($submissions === null) {
            $submissions = $latestApplication?->submissions ?? [];
        }

        $completionMet = $progress >= $minimum;
        $requirements = [];
        $allMet = true;

        foreach ($rule?->requirements ?? [] as $requirement) {
            $item = $this->evaluateRequirement($requirement, $enrollment, $submissions, $latestApplication);
            $requirements[] = $item;
            if (! $item['met']) {
                $allMet = false;
            }
        }

        $legacyRequirementsMet = $this->legacyRequirementsMet($rule, $enrollment);

        $hasIssued = IssuedCertificate::query()
            ->where('tenant_id', $enrollment->tenant_id)
            ->where('course_id', $enrollment->course_id)
            ->where('tenant_user_id', $enrollment->tenant_user_id)
            ->where('status', 'issued')
            ->exists();

        $openApplication = $latestApplication && in_array($latestApplication->status, [
            CertificateApplication::STATUS_PENDING,
            CertificateApplication::STATUS_APPROVED,
            CertificateApplication::STATUS_ISSUED,
        ], true);

        $canApply = $enabled
            && ! $hasIssued
            && ! $openApplication
            && $completionMet
            && $allMet
            && $legacyRequirementsMet;

        $reason = null;
        if (! $enabled) {
            $reason = 'certificate_disabled';
        } elseif ($hasIssued) {
            $reason = 'already_issued';
        } elseif ($openApplication) {
            $reason = 'application_open';
        } elseif (! $completionMet) {
            $reason = 'completion_required';
        } elseif (! $allMet || ! $legacyRequirementsMet) {
            $reason = 'requirements_required';
        }

        return [
            'enabled' => $enabled,
            'has_issued_certificate' => $hasIssued,
            'progress_percent' => $progress,
            'minimum_completion_percentage' => $minimum,
            'completion_met' => $completionMet,
            'requirements' => $requirements,
            'all_requirements_met' => $allMet,
            'legacy_requirements_met' => $legacyRequirementsMet,
            'can_apply' => $canApply,
            'reason' => $reason,
            'latest_application' => $latestApplication?->status,
            'submissions' => $submissions,
        ];
    }

    private function legacyRequirementsMet(?CourseCertificateRule $rule, CourseEnrollment $enrollment): bool
    {
        if (! $rule) {
            return true;
        }

        if ($rule->require_quiz_pass) {
            $quizIds = Quiz::query()
                ->where('tenant_id', $enrollment->tenant_id)
                ->where('course_id', $enrollment->course_id)
                ->where('status', 'published')
                ->pluck('id');

            if ($quizIds->isEmpty()) {
                return false;
            }

            $passedQuizIds = QuizResult::query()
                ->where('tenant_id', $enrollment->tenant_id)
                ->where('tenant_user_id', $enrollment->tenant_user_id)
                ->whereIn('quiz_id', $quizIds->all())
                ->where('passed', true)
                ->pluck('quiz_id')
                ->unique();

            if ($passedQuizIds->count() < $quizIds->count()) {
                return false;
            }
        }

        if ($rule->require_assignment_pass) {
            $assignmentIds = Assignment::query()
                ->where('tenant_id', $enrollment->tenant_id)
                ->where('course_id', $enrollment->course_id)
                ->where('status', 'published')
                ->pluck('id');

            if ($assignmentIds->isEmpty()) {
                return false;
            }

            $passedAssignmentIds = AssignmentResult::query()
                ->where('tenant_id', $enrollment->tenant_id)
                ->where('tenant_user_id', $enrollment->tenant_user_id)
                ->whereIn('assignment_id', $assignmentIds->all())
                ->where('passed', true)
                ->pluck('assignment_id')
                ->unique();

            if ($passedAssignmentIds->count() < $assignmentIds->count()) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<string, string>  $submissions
     * @return array<string, mixed>
     */
    private function evaluateRequirement(
        CertificateRequirement $requirement,
        CourseEnrollment $enrollment,
        array $submissions,
        ?CertificateApplication $application,
    ): array {
        $base = [
            'id' => $requirement->id,
            'type' => $requirement->type,
            'title' => $requirement->title ?: $this->defaultTitle($requirement->type),
            'description' => $requirement->description,
            'required_score' => $requirement->required_score,
            'exam_id' => $requirement->exam_id,
            'exam_title' => $requirement->exam?->title,
            'exam_link' => $requirement->exam_link,
            'submission' => $submissions[(string) $requirement->id] ?? null,
            'manual_status' => null,
            'met' => false,
            'detail' => null,
        ];

        $review = $application?->requirement_reviews[(string) $requirement->id] ?? null;
        if (is_array($review)) {
            $base['manual_status'] = $review['status'] ?? null;
            $base['review_note'] = $review['note'] ?? null;
        }

        if ($requirement->type === CertificateRequirement::TYPE_EXAM_BANK) {
            $attempt = ExamAttempt::query()
                ->where('tenant_id', $enrollment->tenant_id)
                ->where('exam_id', $requirement->exam_id)
                ->where('user_id', $enrollment->student?->user_id)
                ->where('status', 'submitted')
                ->orderByDesc('percentage')
                ->orderByDesc('id')
                ->first();

            $score = $attempt ? (float) ($attempt->percentage ?? 0) : null;
            $required = (float) ($requirement->required_score ?? 0);
            $base['score'] = $score;
            $base['met'] = $score !== null && $score >= $required;
            $base['detail'] = $score === null
                ? 'لم تؤدِ الاختبار بعد.'
                : "أعلى درجة: {$score}% • المطلوب: {$required}%";

            return $base;
        }

        $base['met'] = ! empty($base['submission']);
        $base['detail'] = $base['met']
            ? 'تم تسليم الرابط وهو بانتظار المراجعة.'
            : 'يجب إدخال رابط تسليم صالح.';

        return $base;
    }

    private function defaultTitle(string $type): string
    {
        return match ($type) {
            CertificateRequirement::TYPE_EXAM_BANK => 'اختبار الشهادة',
            CertificateRequirement::TYPE_EXAM_LINK => 'اختبار خارجي',
            CertificateRequirement::TYPE_PROJECT => 'مشروع التسليم',
            default => 'متطلب الشهادة',
        };
    }
}
