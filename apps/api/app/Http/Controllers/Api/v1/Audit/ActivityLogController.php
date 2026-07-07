<?php

namespace App\Http\Controllers\Api\v1\Audit;

use App\Http\Controllers\Controller;
use App\Models\TenantUser;
use App\Policies\AuditPolicy;
use App\Services\Audit\AuditQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request, AuditQueryService $audit, AuditPolicy $policy): JsonResponse
    {
        abort_unless($policy->viewActivityLogs(app(TenantUser::class), currentTenant()), 403);

        $filters = $this->validateFilters($request);

        return response()->json(
            $audit->activityLogs(currentTenant(), app(TenantUser::class), $filters),
        );
    }

    public function me(Request $request, AuditQueryService $audit, AuditPolicy $policy): JsonResponse
    {
        abort_unless($policy->viewOwnActivity(app(TenantUser::class), currentTenant()), 403);

        $filters = $this->validateFilters($request);

        return response()->json(
            $audit->myActivity(currentTenant(), app(TenantUser::class), $filters),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function validateFilters(Request $request): array
    {
        return $request->validate([
            'activity_type' => ['sometimes', 'string', 'max:100'],
            'entity_type' => ['sometimes', 'string', 'max:100'],
            'entity_id' => ['sometimes'],
        ]);
    }
}
