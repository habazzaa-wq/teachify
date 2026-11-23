<?php

namespace App\Services\Certificates;

use App\Models\CertificateRequirement;
use App\Models\CertificateTemplate;
use App\Models\Course;
use App\Models\CourseCertificateRule;
use App\Models\Exam;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CertificateRuleService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Course $course, array $data): CourseCertificateRule
    {
        $tenantId = currentTenant()->id;

        if ($course->tenant_id !== $tenantId) {
            throw ValidationException::withMessages([
                'course' => ['The selected course is invalid for this tenant.'],
            ]);
        }

        $templateId = $data['certificate_template_id'] ?? null;

        if ($templateId) {
            $template = CertificateTemplate::query()
                ->where('tenant_id', $tenantId)
                ->whereKey($templateId)
                ->first();

            if (! $template) {
                throw ValidationException::withMessages([
                    'certificate_template_id' => ['The selected certificate template is invalid for this tenant.'],
                ]);
            }

            if (($data['enabled'] ?? false) && $template->status !== 'active') {
                throw ValidationException::withMessages([
                    'certificate_template_id' => ['Only active certificate templates can be enabled for issuance.'],
                ]);
            }
        }

        $requirements = $data['requirements'] ?? null;
        if ($requirements !== null && ! is_array($requirements)) {
            throw ValidationException::withMessages([
                'requirements' => ['Requirements must be an array.'],
            ]);
        }

        if (is_array($requirements)) {
            foreach ($requirements as $index => $requirement) {
                if (! is_array($requirement)) {
                    throw ValidationException::withMessages([
                        "requirements.{$index}" => ['Invalid requirement.'],
                    ]);
                }

                $type = $requirement['type'] ?? null;
                if (! in_array($type, [
                    CertificateRequirement::TYPE_EXAM_BANK,
                    CertificateRequirement::TYPE_EXAM_LINK,
                    CertificateRequirement::TYPE_PROJECT,
                ], true)) {
                    throw ValidationException::withMessages([
                        "requirements.{$index}.type" => ['Requirement type must be exam_bank, exam_link or project.'],
                    ]);
                }

                if ($type === CertificateRequirement::TYPE_EXAM_BANK) {
                    $examId = $requirement['exam_id'] ?? null;
                    $exam = $examId ? Exam::query()
                        ->where('tenant_id', $tenantId)
                        ->whereKey($examId)
                        ->first() : null;

                    if (! $exam) {
                        throw ValidationException::withMessages([
                            "requirements.{$index}.exam_id" => ['Choose a valid exam from the exam bank.'],
                        ]);
                    }
                }

                if (in_array($type, [CertificateRequirement::TYPE_EXAM_LINK, CertificateRequirement::TYPE_PROJECT], true)) {
                    $link = trim((string) ($requirement['exam_link'] ?? ''));
                    if ($link !== '' && ! filter_var($link, FILTER_VALIDATE_URL)) {
                        throw ValidationException::withMessages([
                            "requirements.{$index}.exam_link" => ['Enter a valid URL.'],
                        ]);
                    }
                }

                $score = $requirement['required_score'] ?? null;
                if ($type === CertificateRequirement::TYPE_EXAM_BANK && ($score === null || $score === '')) {
                    throw ValidationException::withMessages([
                        "requirements.{$index}.required_score" => ['A passing score is required for bank exams.'],
                    ]);
                }
                if ($score !== null && $score !== '' && ($score < 0 || $score > 100)) {
                    throw ValidationException::withMessages([
                        "requirements.{$index}.required_score" => ['Passing score must be between 0 and 100.'],
                    ]);
                }
            }
        }

        $rule = DB::transaction(function () use ($course, $data, $tenantId, $templateId, $requirements): CourseCertificateRule {
            $rule = CourseCertificateRule::updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'course_id' => $course->id,
                ],
                [
                    'certificate_template_id' => $templateId,
                    'enabled' => $data['enabled'] ?? false,
                    'require_course_completion' => $data['require_course_completion'] ?? true,
                    'require_quiz_pass' => $data['require_quiz_pass'] ?? false,
                    'require_assignment_pass' => $data['require_assignment_pass'] ?? false,
                    'minimum_completion_percentage' => $data['minimum_completion_percentage'] ?? 100,
                    'show_instructor_signature' => $data['show_instructor_signature'] ?? false,
                    'manager_signature_name' => $data['manager_signature_name'] ?? null,
                    'manager_signature_title' => $data['manager_signature_title'] ?? null,
                    'manager_signature_url' => $data['manager_signature_url'] ?? null,
                    'instructor_signature_url' => $data['instructor_signature_url'] ?? null,
                ],
            );

            if ($requirements !== null) {
                $keepIds = [];

                foreach ($requirements as $index => $requirement) {
                    $payload = [
                        'tenant_id' => $tenantId,
                        'course_id' => $course->id,
                        'course_certificate_rule_id' => $rule->id,
                        'type' => $requirement['type'],
                        'title' => $requirement['title'] ?? null,
                        'description' => $requirement['description'] ?? null,
                        'exam_id' => $requirement['type'] === CertificateRequirement::TYPE_EXAM_BANK
                            ? ($requirement['exam_id'] ?? null)
                            : null,
                        'exam_link' => $requirement['type'] === CertificateRequirement::TYPE_EXAM_LINK
                            ? ($requirement['exam_link'] ?? null)
                            : null,
                        'required_score' => $requirement['type'] === CertificateRequirement::TYPE_EXAM_BANK
                            ? ($requirement['required_score'] ?? null)
                            : null,
                        'sort_order' => $requirement['sort_order'] ?? $index,
                    ];

                    if (! empty($requirement['id'])) {
                        $existing = CertificateRequirement::query()
                            ->where('tenant_id', $tenantId)
                            ->where('course_id', $course->id)
                            ->whereKey($requirement['id'])
                            ->first();

                        if ($existing) {
                            $existing->update($payload);
                            $keepIds[] = $existing->id;

                            continue;
                        }
                    }

                    $keepIds[] = CertificateRequirement::create($payload)->id;
                }

                CertificateRequirement::query()
                    ->where('tenant_id', $tenantId)
                    ->where('course_id', $course->id)
                    ->when(count($keepIds) > 0, fn ($query) => $query->whereNotIn('id', $keepIds))
                    ->delete();
            }

            return $rule;
        });

        return $rule->refresh()->load(['template', 'requirements.exam']);
    }

    /**
     * @return array<string, mixed>
     */
    public function serialize(CourseCertificateRule $rule): array
    {
        $rule->loadMissing(['template', 'requirements.exam']);

        return [
            'id' => $rule->id,
            'course_id' => $rule->course_id,
            'certificate_template_id' => $rule->certificate_template_id,
            'enabled' => $rule->enabled,
            'require_course_completion' => $rule->require_course_completion,
            'require_quiz_pass' => $rule->require_quiz_pass,
            'require_assignment_pass' => $rule->require_assignment_pass,
            'minimum_completion_percentage' => $rule->minimum_completion_percentage,
            'show_instructor_signature' => $rule->show_instructor_signature,
            'manager_signature_name' => $rule->manager_signature_name,
            'manager_signature_title' => $rule->manager_signature_title,
            'manager_signature_url' => $rule->manager_signature_url,
            'instructor_signature_url' => $rule->instructor_signature_url,
            'template' => $rule->template,
            'requirements' => $rule->requirements->map(fn (CertificateRequirement $requirement) => [
                'id' => $requirement->id,
                'type' => $requirement->type,
                'title' => $requirement->title,
                'description' => $requirement->description,
                'exam_id' => $requirement->exam_id,
                'exam_title' => $requirement->exam?->title,
                'exam_link' => $requirement->exam_link,
                'required_score' => $requirement->required_score,
                'sort_order' => $requirement->sort_order,
            ])->all(),
        ];
    }
}
