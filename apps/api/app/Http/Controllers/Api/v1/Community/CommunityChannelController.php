<?php

namespace App\Http\Controllers\Api\v1\Community;

use App\Http\Controllers\Controller;
use App\Http\Resources\Community\CommunityCategoryResource;
use App\Http\Resources\Community\CommunityChannelResource;
use App\Http\Resources\Community\CommunityThreadResource;
use App\Models\CommunityChannel;
use App\Models\TenantUser;
use App\Policies\CommunityChannelPolicy;
use App\Policies\CommunityModerationPolicy;
use App\Policies\CommunityPolicy;
use App\Services\Community\CommunityAccessService;
use App\Services\Community\CommunityChannelService;
use App\Services\Community\CommunityModerationService;
use Illuminate\Http\JsonResponse;

class CommunityChannelController extends Controller
{
    public function index(
        CommunityChannelService $channels,
        CommunityPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();
        $member = app(TenantUser::class);

        abort_unless($policy->view($member, $tenant), 403);

        return response()->json([
            'categories' => CommunityCategoryResource::collection($channels->categories($tenant, $member)),
        ]);
    }

    public function show(
        CommunityChannel $channel,
        CommunityChannelService $channels,
        CommunityChannelPolicy $policy,
    ): JsonResponse {
        abort_unless($policy->view(app(TenantUser::class), currentTenant(), $channel), 403);

        return response()->json([
            'channel' => new CommunityChannelResource($channels->channel(currentTenant(), $channel->id)),
        ]);
    }

    public function threads(
        CommunityChannel $channel,
        CommunityChannelService $channels,
        CommunityAccessService $access,
        CommunityChannelPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();
        $member = app(TenantUser::class);

        abort_unless($policy->viewMessages($member, $tenant, $channel), 403);

        return response()->json([
            'threads' => CommunityThreadResource::collection(
                $channels->threads($tenant, $channel, $access->isModerator($member, $tenant)),
            ),
        ]);
    }

    public function lock(
        CommunityChannel $channel,
        CommunityModerationService $moderation,
        CommunityModerationPolicy $policy,
    ): JsonResponse {
        abort_unless($policy->lockChannel(app(TenantUser::class), currentTenant(), $channel), 403);

        return response()->json([
            'message' => 'Channel locked.',
            'channel' => new CommunityChannelResource(
                $moderation->lockChannel(currentTenant(), $channel, app(TenantUser::class), true),
            ),
        ]);
    }

    public function unlock(
        CommunityChannel $channel,
        CommunityModerationService $moderation,
        CommunityModerationPolicy $policy,
    ): JsonResponse {
        abort_unless($policy->lockChannel(app(TenantUser::class), currentTenant(), $channel), 403);

        return response()->json([
            'message' => 'Channel unlocked.',
            'channel' => new CommunityChannelResource(
                $moderation->lockChannel(currentTenant(), $channel, app(TenantUser::class), false),
            ),
        ]);
    }
}
