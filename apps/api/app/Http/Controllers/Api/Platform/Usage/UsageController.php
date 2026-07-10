<?php

namespace App\Http\Controllers\Api\Platform\Usage;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\Usage\TenantUsageService;
use App\Services\Usage\TenantQuotaService;
use App\Services\Usage\UsageSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class UsageController extends Controller
{
    public function __construct(
        private readonly TenantUsageService $usage,
        private readonly TenantQuotaService $quota,
        private readonly UsageSyncService $sync,
    ) {
    }

    public function current(Tenant $tenant): JsonResponse
    {
        Gate::authorize('view', Tenant::class);

        return response()->json([
            'data' => $this->usage->getUsage($tenant->id),
        ]);
    }

    public function history(Request $request, Tenant $tenant): JsonResponse
    {
        Gate::authorize('view', Tenant::class);

        $period = $request->get('period', 'daily');
        $limit = min((int) $request->get('limit', 30), 365);

        return response()->json([
            'data' => $this->usage->getUsageHistory($tenant->id, $period, $limit),
        ]);
    }

    public function snapshot(Request $request, Tenant $tenant): JsonResponse
    {
        Gate::authorize('view', Tenant::class);

        $since = $request->get('since');

        return response()->json([
            'data' => $this->usage->getUsageSnapshot($tenant->id, $since),
        ]);
    }

    public function quota(Tenant $tenant): JsonResponse
    {
        Gate::authorize('view', Tenant::class);

        return response()->json([
            'data' => $this->usage->getQuota($tenant->id),
        ]);
    }

    public function remaining(Tenant $tenant): JsonResponse
    {
        Gate::authorize('view', Tenant::class);

        return response()->json([
            'data' => $this->usage->getRemainingLimits($tenant->id),
        ]);
    }

    public function syncStatus(Tenant $tenant): JsonResponse
    {
        Gate::authorize('view', Tenant::class);

        return response()->json([
            'data' => $this->usage->getSyncStatus($tenant->id),
        ]);
    }

    public function sync(Tenant $tenant): JsonResponse
    {
        Gate::authorize('update', Tenant::class);

        $this->sync->queueSync($tenant->id);

        return response()->json([
            'message' => 'Usage sync queued.',
            'tenant_id' => $tenant->id,
        ]);
    }

    public function verify(Tenant $tenant): JsonResponse
    {
        Gate::authorize('view', Tenant::class);

        return response()->json([
            'can_upload' => $this->quota->canUpload($tenant->id),
            'can_create_video' => $this->quota->canCreateVideo($tenant->id),
            'remaining_storage_bytes' => $this->quota->remainingStorage($tenant->id),
            'remaining_bandwidth_bytes' => $this->quota->remainingBandwidth($tenant->id),
        ]);
    }
}