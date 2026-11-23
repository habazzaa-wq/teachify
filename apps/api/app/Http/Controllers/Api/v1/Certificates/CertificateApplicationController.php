<?php

namespace App\Http\Controllers\Api\v1\Certificates;

use App\Http\Controllers\Controller;
use App\Models\CertificateApplication;
use App\Models\CourseEnrollment;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Certificates\CertificateApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CertificateApplicationController extends Controller
{
    public function index(Request $request, CertificateApplicationService $applications): JsonResponse
    {
        abort_unless($this->canManage(request()->user()), 403);

        $filters = $request->validate([
            'status' => ['sometimes', 'string', 'in:pending,approved,rejected,issued,cancelled'],
            'course_id' => ['sometimes', 'integer'],
            'search' => ['sometimes', 'string', 'max:255'],
        ]);

        return response()->json([
            'applications' => $applications->listForTenant(currentTenant(), $filters),
        ]);
    }

    public function myApplications(CertificateApplicationService $applications): JsonResponse
    {
        $membership = $this->currentMembership();
        abort_unless($membership, 403);

        return response()->json([
            'applications' => $applications->listForStudent(currentTenant(), $membership)->values(),
        ]);
    }

    public function eligibility(CourseEnrollment $enrollment, CertificateApplicationService $applications): JsonResponse
    {
        abort_if($enrollment->tenant_id !== currentTenant()->id, 404);
        $membership = $this->currentMembership();
        abort_unless($membership && $enrollment->tenant_user_id === $membership->id, 403);

        return response()->json($applications->eligibility($enrollment));
    }

    public function apply(Request $request, CertificateApplicationService $applications): JsonResponse
    {
        $membership = $this->currentMembership();
        abort_unless($membership, 403);

        $validated = $request->validate([
            'enrollment_id' => ['required', 'integer'],
            'note' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'submissions' => ['sometimes', 'array'],
            'submissions.*' => ['sometimes', 'nullable', 'string', 'max:2048'],
        ]);

        $enrollment = CourseEnrollment::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('tenant_user_id', $membership->id)
            ->findOrFail($validated['enrollment_id']);

        $application = $applications->apply(
            $enrollment,
            $membership,
            $validated['note'] ?? null,
            array_filter($validated['submissions'] ?? [], fn ($value) => is_string($value) && trim($value) !== ''),
        );

        return response()->json([
            'message' => 'تم تقديم طلب الشهادة بنجاح.',
            'application' => $application,
        ], 201);
    }

    public function approve(Request $request, CertificateApplication $application, CertificateApplicationService $applications): JsonResponse
    {
        abort_if($application->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canManage(request()->user()), 403);

        $validated = $request->validate([
            'admin_note' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'issue_and_send' => ['sometimes', 'boolean'],
            'requirement_reviews' => ['sometimes', 'array'],
            'requirement_reviews.*.status' => ['required_with:requirement_reviews', 'string', 'in:approved,rejected'],
            'requirement_reviews.*.note' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $reviewer = $this->currentMembership();
        abort_unless($reviewer, 403);

        $application = $applications->approve(
            $application,
            $reviewer,
            $validated['admin_note'] ?? null,
            (bool) ($validated['issue_and_send'] ?? true),
            $validated['requirement_reviews'] ?? [],
        );

        return response()->json([
            'message' => $application->status === CertificateApplication::STATUS_REJECTED
                ? 'تم رفض طلب الشهادة.'
                : 'تمت الموافقة على طلب الشهادة.',
            'application' => $application,
        ]);
    }

    public function reject(Request $request, CertificateApplication $application, CertificateApplicationService $applications): JsonResponse
    {
        abort_if($application->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canManage(request()->user()), 403);

        $validated = $request->validate([
            'admin_note' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $reviewer = $this->currentMembership();
        abort_unless($reviewer, 403);

        $application = $applications->reject($application, $reviewer, $validated['admin_note'] ?? null);

        return response()->json([
            'message' => 'تم رفض طلب الشهادة.',
            'application' => $application,
        ]);
    }

    public function issue(CertificateApplication $application, CertificateApplicationService $applications): JsonResponse
    {
        abort_if($application->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canManage(request()->user()), 403);

        $reviewer = $this->currentMembership();
        abort_unless($reviewer, 403);

        $application = $applications->issueForApplication($application, $reviewer);

        return response()->json([
            'message' => 'تم إصدار الشهادة وإرسالها.',
            'application' => $application,
        ]);
    }

    private function canManage(User $user): bool
    {
        $authorization = app(TenantAuthorizationService::class);
        $tenant = currentTenant();

        return (
            $authorization->hasRole($user, $tenant, 'tenant_owner')
            || $authorization->hasRole($user, $tenant, 'admin')
        ) && $authorization->hasPermission($user, $tenant, 'certificates.view');
    }

    private function currentMembership(): ?TenantUser
    {
        $membership = app(TenantUser::class);

        return $membership && $membership->tenant_id === currentTenant()->id ? $membership : null;
    }
}
