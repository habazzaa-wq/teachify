<?php

namespace App\Http\Controllers\Api\v1\Audit;

use App\Http\Controllers\Controller;
use App\Models\TenantUser;
use App\Policies\AuditPolicy;
use App\Services\Audit\AuditQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request, AuditQueryService $audit, AuditPolicy $policy): JsonResponse
    {
        abort_unless($policy->viewAuditLogs(app(TenantUser::class), currentTenant()), 403);

        $filters = $this->validateFilters($request);

        return response()->json(
            $audit->auditLogs(currentTenant(), app(TenantUser::class), $filters),
        );
    }

    public function entity(Request $request, AuditQueryService $audit, AuditPolicy $policy): JsonResponse
    {
        abort_unless($policy->viewAuditLogs(app(TenantUser::class), currentTenant()), 403);

        $validated = $request->validate([
            'entity_type' => ['required', 'string', 'max:100'],
            'entity_id' => ['required'],
        ]);

        return response()->json(
            $audit->entityHistory(currentTenant(), app(TenantUser::class), $validated['entity_type'], $validated['entity_id']),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function validateFilters(Request $request): array
    {
        return $request->validate([
            'event_type' => ['sometimes', 'string', 'max:100'],
            'tenant_user_id' => ['sometimes', 'integer'],
            'entity_type' => ['sometimes', 'string', 'max:100'],
            'entity_id' => ['sometimes'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date'],
        ]);
    }
}
