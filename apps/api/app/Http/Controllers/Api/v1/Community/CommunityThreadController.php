<?php

namespace App\Http\Controllers\Api\v1\Community;

use App\Http\Controllers\Controller;
use App\Http\Requests\Community\StoreCommunityThreadRequest;
use App\Http\Resources\Community\CommunityThreadResource;
use App\Models\CommunityChannel;
use App\Models\CommunityThread;
use App\Models\TenantUser;
use App\Policies\CommunityThreadPolicy;
use App\Services\Community\CommunityChannelService;
use App\Services\Community\CommunityEngagementService;
use Illuminate\Http\JsonResponse;

class CommunityThreadController extends Controller
{
    public function store(
        StoreCommunityThreadRequest $request,
        CommunityChannel $channel,
        CommunityChannelService $channels,
        CommunityThreadPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();
        $member = app(TenantUser::class);

        abort_unless($policy->create($member, $tenant, $channel), 403);

        $thread = $channels->createThread($tenant, $member, $channel, $request->validated());

        return response()->json([
            'message' => 'Thread created.',
            'thread' => new CommunityThreadResource($thread),
        ], 201);
    }

    public function show(
        CommunityThread $thread,
        CommunityChannelService $channels,
        CommunityThreadPolicy $policy,
    ): JsonResponse {
        abort_unless($policy->view(app(TenantUser::class), currentTenant(), $thread), 403);

        return response()->json([
            'thread' => new CommunityThreadResource($channels->thread(currentTenant(), $thread->id)),
        ]);
    }

    public function follow(
        CommunityThread $thread,
        CommunityEngagementService $engagement,
        CommunityThreadPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->follow(app(TenantUser::class), $tenant, $thread), 403);

        $engagement->followThread($tenant, $thread, app(TenantUser::class));

        return response()->json(['message' => 'Thread followed.']);
    }

    public function unfollow(
        CommunityThread $thread,
        CommunityEngagementService $engagement,
        CommunityThreadPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->follow(app(TenantUser::class), $tenant, $thread), 403);

        $engagement->unfollow($tenant, app(TenantUser::class), $thread->channel_id, $thread->id);

        return response()->json(['message' => 'Thread unfollowed.']);
    }

    public function mute(
        CommunityThread $thread,
        CommunityEngagementService $engagement,
        CommunityThreadPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->mute(app(TenantUser::class), $tenant, $thread), 403);

        $engagement->followThread($tenant, $thread, app(TenantUser::class), muted: true);

        return response()->json(['message' => 'Thread muted.']);
    }

    public function unmute(
        CommunityThread $thread,
        CommunityEngagementService $engagement,
        CommunityThreadPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->mute(app(TenantUser::class), $tenant, $thread), 403);

        $engagement->followThread($tenant, $thread, app(TenantUser::class), muted: false);

        return response()->json(['message' => 'Thread unmuted.']);
    }
}
