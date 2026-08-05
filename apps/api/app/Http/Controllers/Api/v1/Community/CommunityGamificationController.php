<?php

namespace App\Http\Controllers\Api\v1\Community;

use App\Http\Controllers\Controller;
use App\Http\Resources\Community\CommunityGamificationResource;
use App\Models\TenantUser;
use App\Policies\CommunityGamificationPolicy;
use App\Policies\CommunityPolicy;
use App\Services\Community\CommunityGamificationService;
use Illuminate\Http\JsonResponse;

class CommunityGamificationController extends Controller
{
    public function me(
        CommunityGamificationService $gamification,
        CommunityPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();
        $member = app(TenantUser::class);

        abort_unless($policy->view($member, $tenant), 403);

        $totalXp = $gamification->totalXp($tenant, $member);

        return response()->json([
            'total_xp' => $totalXp,
            'today_xp' => $gamification->todayXp($tenant, $member),
            'rank' => $gamification->rankFor($totalXp),
        ]);
    }

    public function leaderboard(
        CommunityGamificationService $gamification,
        CommunityGamificationPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->viewLeaderboard(app(TenantUser::class), $tenant), 403);

        $rows = $gamification->leaderboard($tenant, 10)
            ->values()
            ->map(function ($row, int $index): object {
                $row->rank = $index + 1;

                return $row;
            });

        return response()->json([
            'leaderboard' => CommunityGamificationResource::collection($rows),
        ]);
    }
}
