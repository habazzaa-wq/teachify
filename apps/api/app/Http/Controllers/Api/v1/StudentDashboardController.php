<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\TenantUser;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Student\StudentDashboardService;
use Illuminate\Http\JsonResponse;

/**
 * Read-only aggregated dashboard for the current learner. Scoped to the active
 * tenant membership and the authenticated user; only students may access it.
 */
class StudentDashboardController extends Controller
{
    public function show(StudentDashboardService $service): JsonResponse
    {
        $membership = app(TenantUser::class);

        abort_if($membership->tenant_id !== currentTenant()->id, 404);
        abort_unless(
            app(TenantAuthorizationService::class)->hasRole(request()->user(), currentTenant(), 'student'),
            403,
        );

        return response()->json([
            'data' => $service->dashboard(request()->user(), $membership, currentTenant()),
        ]);
    }
}
