<?php

namespace App\Services\Certificates;

use App\Models\CertificateTemplate;
use App\Models\Course;
use App\Models\CourseCertificateRule;
use Illuminate\Validation\ValidationException;

class CertificateRuleService
{
    /**
     * @param array<string, mixed> $data
     */
    public function update(Course $course, array $data): CourseCertificateRule
    {
        if ($course->tenant_id !== currentTenant()->id) {
            throw ValidationException::withMessages([
                'course' => ['The selected course is invalid for this tenant.'],
            ]);
        }

        $templateId = $data['certificate_template_id'] ?? null;

        if ($templateId) {
            $template = CertificateTemplate::query()
                ->where('tenant_id', currentTenant()->id)
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

        return CourseCertificateRule::updateOrCreate(
            [
                'tenant_id' => currentTenant()->id,
                'course_id' => $course->id,
            ],
            [
                'certificate_template_id' => $templateId,
                'enabled' => $data['enabled'] ?? false,
                'require_course_completion' => $data['require_course_completion'] ?? true,
                'require_quiz_pass' => $data['require_quiz_pass'] ?? false,
                'require_assignment_pass' => $data['require_assignment_pass'] ?? false,
                'minimum_completion_percentage' => $data['minimum_completion_percentage'] ?? 100,
            ],
        )->refresh()->load('template');
    }
}
