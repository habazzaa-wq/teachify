<?php

namespace App\Http\Controllers\Api\v1\Instructor;

use App\Http\Controllers\Controller;
use App\Models\CertificateApplication;
use App\Models\CertificateTemplate;
use App\Models\Course;
use App\Models\TenantUser;
use App\Services\Certificates\CertificateApplicationService;
use App\Services\Certificates\CertificateRuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstructorCertificateController extends Controller
{
    public function templates(): JsonResponse
    {
        return response()->json([
            'templates' => CertificateTemplate::query()
                ->where('tenant_id', currentTenant()->id)
                ->where('status', 'active')
                ->latest()
                ->get(),
        ]);
    }

    public function applications(Request $request, CertificateApplicationService $applications): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['sometimes', 'string', 'in:pending,approved,rejected,issued,cancelled'],
            'course_id' => ['sometimes', 'integer'],
            'search' => ['sometimes', 'string', 'max:255'],
        ]);

        return response()->json([
            'applications' => $applications->listForTenant(currentTenant(), $filters, $this->instructor($request)),
        ]);
    }

    public function approve(Request $request, CertificateApplication $application, CertificateApplicationService $applications): JsonResponse
    {
        $this->assertOwned($request, $application);

        $validated = $request->validate([
            'admin_note' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'issue_and_send' => ['sometimes', 'boolean'],
            'requirement_reviews' => ['sometimes', 'array'],
            'requirement_reviews.*.status' => ['required_with:requirement_reviews', 'string', 'in:approved,rejected'],
            'requirement_reviews.*.note' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $result = $applications->approve(
            $application,
            $this->instructor($request),
            $validated['admin_note'] ?? null,
            (bool) ($validated['issue_and_send'] ?? true),
            $validated['requirement_reviews'] ?? [],
        );

        return response()->json([
            'message' => $result->status === CertificateApplication::STATUS_REJECTED
                ? 'تم رفض طلب الشهادة.'
                : 'تمت الموافقة على طلب الشهادة.',
            'application' => $result,
        ]);
    }

    public function reject(Request $request, CertificateApplication $application, CertificateApplicationService $applications): JsonResponse
    {
        $this->assertOwned($request, $application);

        $validated = $request->validate([
            'admin_note' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $result = $applications->reject($application, $this->instructor($request), $validated['admin_note'] ?? null);

        return response()->json(['message' => 'تم رفض طلب الشهادة.', 'application' => $result]);
    }

    public function showRule(Request $request, Course $course, CertificateRuleService $rules): JsonResponse
    {
        $this->assertCourseOwned($request, $course);
        $rule = $course->certificateRule()->with('template', 'requirements.exam')->first();

        return response()->json(['rule' => $rule ? $rules->serialize($rule) : null]);
    }

    public function updateRule(Request $request, Course $course, CertificateRuleService $rules): JsonResponse
    {
        $this->assertCourseOwned($request, $course);

        $validated = $request->validate([
            'certificate_template_id' => ['nullable', 'integer'],
            'enabled' => ['sometimes', 'boolean'],
            'require_course_completion' => ['sometimes', 'boolean'],
            'require_quiz_pass' => ['sometimes', 'boolean'],
            'require_assignment_pass' => ['sometimes', 'boolean'],
            'minimum_completion_percentage' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'show_instructor_signature' => ['sometimes', 'boolean'],
            'manager_signature_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'manager_signature_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'manager_signature_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'instructor_signature_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'requirements' => ['sometimes', 'array'],
            'requirements.*.id' => ['sometimes', 'integer'],
            'requirements.*.type' => ['required_with:requirements', 'string', 'in:exam_bank,exam_link,project'],
            'requirements.*.title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'requirements.*.description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'requirements.*.exam_id' => ['sometimes', 'nullable', 'integer'],
            'requirements.*.exam_link' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'requirements.*.required_score' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100'],
            'requirements.*.sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        return response()->json([
            'message' => 'Course certificate rule updated.',
            'rule' => $rules->update($course, $validated),
        ]);
    }

    private function instructor(Request $request): TenantUser
    {
        $membership = $request->attributes->get('instructorMembership');
        abort_unless($membership instanceof TenantUser, 403);

        return $membership;
    }

    private function assertOwned(Request $request, CertificateApplication $application): void
    {
        abort_if($application->tenant_id !== currentTenant()->id, 404);

        $instructor = $this->instructor($request);
        $course = $application->course ?: Course::query()->findOrFail($application->course_id);
        $this->assertCourseOwned($request, $course);
    }

    private function assertCourseOwned(Request $request, Course $course): void
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);

        $instructor = $this->instructor($request);
        $owned = $course->created_by_tenant_user_id === $instructor->id
            || $course->primary_instructor_tenant_user_id === $instructor->id
            || $course->instructors()->where('tenant_user_id', $instructor->id)->exists();

        abort_unless($owned, 403);
    }
}
