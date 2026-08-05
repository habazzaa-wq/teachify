<?php

namespace App\Http\Controllers\Api\v1\Community;

use App\Http\Controllers\Controller;
use App\Http\Requests\Community\CommunityPresenceRequest;
use App\Http\Requests\Community\CommunityTypingRequest;
use App\Http\Resources\Community\CommunityPresenceResource;
use App\Models\CommunityChannel;
use App\Models\TenantUser;
use App\Policies\CommunityPresencePolicy;
use App\Services\Community\CommunityPresenceService;
use Illuminate\Http\JsonResponse;

class CommunityPresenceController extends Controller
{
    public function online(
        CommunityPresenceRequest $request,
        CommunityPresenceService $presence,
        CommunityPresencePolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();
        $member = app(TenantUser::class);

        abort_unless($policy->update($member, $tenant), 403);

        return response()->json([
            'presence' => new CommunityPresenceResource(
                $presence->online($tenant, $member, $request->validated()['channel_id'] ?? null),
            ),
        ]);
    }

    public function offline(
        CommunityPresenceService $presence,
        CommunityPresencePolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->update(app(TenantUser::class), $tenant), 403);

        return response()->json([
            'presence' => new CommunityPresenceResource(
                $presence->offline($tenant, app(TenantUser::class)),
            ),
        ]);
    }

    public function onlineMembers(
        CommunityPresenceRequest $request,
        CommunityPresenceService $presence,
        CommunityPresencePolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->viewOnline(app(TenantUser::class), $tenant), 403);

        return response()->json([
            'members' => CommunityPresenceResource::collection(
                $presence->onlineMembers($tenant, $request->validated()['channel_id'] ?? null),
            ),
        ]);
    }

    public function typing(
        CommunityTypingRequest $request,
        CommunityChannel $channel,
        CommunityPresenceService $presence,
        CommunityPresencePolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->typing(app(TenantUser::class), $tenant, $channel), 403);

        $presence->typing($tenant, app(TenantUser::class), $channel, $request->validated()['thread_id'] ?? null);

        return response()->json(['message' => 'typing']);
    }
}
