<?php

namespace App\Http\Controllers\Api\v1\Certificates;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Certificates\CertificateRuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseCertificateRuleController extends Controller
{
    public function show(Course $course): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canManage(request()->user()), 403);

        return response()->json([
            'rule' => $course->certificateRule()->with('template')->first(),
        ]);
    }

    public function update(Request $request, Course $course, CertificateRuleService $rules): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canManage(request()->user()), 403);

        $validated = $request->validate([
            'certificate_template_id' => ['nullable', 'integer'],
            'enabled' => ['sometimes', 'boolean'],
            'require_course_completion' => ['sometimes', 'boolean'],
            'require_quiz_pass' => ['sometimes', 'boolean'],
            'require_assignment_pass' => ['sometimes', 'boolean'],
            'minimum_completion_percentage' => ['sometimes', 'integer', 'min:0', 'max:100'],
        ]);

        $rule = $rules->update($course, $validated);

        return response()->json([
            'message' => 'Course certificate rule updated.',
            'rule' => $rule,
        ]);
    }

    private function canManage(User $user): bool
    {
        $authorization = app(TenantAuthorizationService::class);
        $tenant = currentTenant();

        return (
            $authorization->hasRole($user, $tenant, 'tenant_owner')
            || $authorization->hasRole($user, $tenant, 'admin')
        ) && $authorization->hasPermission($user, $tenant, 'courses.update');
    }
}
