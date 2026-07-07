<?php

namespace App\Http\Controllers\Api\v1\Learning;

use App\Http\Controllers\Controller;
use App\Models\CourseEnrollment;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Learning\CompletionService;
use Illuminate\Http\JsonResponse;

class CompletionController extends Controller
{
    public function show(CourseEnrollment $enrollment, CompletionService $completions): JsonResponse
    {
        abort_if($enrollment->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canViewEnrollment(request()->user(), $enrollment), 403);

        return response()->json([
            'completion' => $completions->synchronize($enrollment),
        ]);
    }

    private function canViewEnrollment(User $user, CourseEnrollment $enrollment): bool
    {
        $tenant = currentTenant();
        $membership = app(TenantUser::class);

        if ($enrollment->tenant_user_id === $membership->id) {
            return $this->auth()->hasPermission($user, $tenant, 'enrollments.view');
        }

        if ($this->isOperator($user, $tenant)) {
            return true;
        }

        return $this->auth()->hasRole($user, $tenant, 'instructor')
            && $this->auth()->hasPermission($user, $tenant, 'enrollments.view')
            && (
                $enrollment->course->created_by_tenant_user_id === $membership->id
                || $enrollment->course->primary_instructor_tenant_user_id === $membership->id
                || $enrollment->course->instructors()->where('tenant_user_id', $membership->id)->exists()
            );
    }

    private function isOperator(User $user, Tenant $tenant): bool
    {
        return $this->auth()->hasRole($user, $tenant, 'tenant_owner')
            || $this->auth()->hasRole($user, $tenant, 'admin');
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
