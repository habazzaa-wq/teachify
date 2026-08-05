<?php

namespace App\Http\Controllers\Api\v1\Community;

use App\Http\Controllers\Controller;
use App\Http\Requests\Community\ToggleCommunityReactionRequest;
use App\Models\CommunityMessage;
use App\Models\TenantUser;
use App\Policies\CommunityMessagePolicy;
use App\Services\Community\CommunityReactionService;
use Illuminate\Http\JsonResponse;

class CommunityReactionController extends Controller
{
    public function store(
        ToggleCommunityReactionRequest $request,
        CommunityMessage $message,
        CommunityReactionService $reactions,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        abort_unless($policy->react(app(TenantUser::class), currentTenant(), $message), 403);

        $result = $reactions->toggle(
            currentTenant(),
            $message,
            app(TenantUser::class),
            $request->validated()['emoji'],
        );

        return response()->json([
            'action' => $result['action'],
            'reaction' => $result['reaction'],
        ]);
    }
}
