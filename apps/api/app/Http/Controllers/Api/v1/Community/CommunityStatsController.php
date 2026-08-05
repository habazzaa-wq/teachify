<?php

namespace App\Http\Controllers\Api\v1\Community;

use App\Http\Controllers\Controller;
use App\Http\Resources\Community\CommunityStatsResource;
use App\Models\TenantUser;
use App\Policies\CommunityStatsPolicy;
use App\Services\Community\CommunityStatsService;
use Illuminate\Http\JsonResponse;

class CommunityStatsController extends Controller
{
    public function show(
        CommunityStatsService $stats,
        CommunityStatsPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->view(app(TenantUser::class), $tenant), 403);

        $rows = collect($stats->snapshot($tenant))
            ->map(fn (array $entry, string $key) => array_merge(['key' => $key], $entry))
            ->values();

        return response()->json([
            'stats' => CommunityStatsResource::collection($rows),
        ]);
    }
}
