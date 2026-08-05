<?php

namespace App\Http\Controllers\Api\v1\Community;

use App\Http\Controllers\Controller;
use App\Http\Requests\Community\StoreCommunityBookmarkRequest;
use App\Http\Resources\Community\CommunityBookmarkResource;
use App\Models\CommunityMessage;
use App\Models\TenantUser;
use App\Policies\CommunityMessagePolicy;
use App\Policies\CommunityPolicy;
use App\Services\Community\CommunityEngagementService;
use Illuminate\Http\JsonResponse;

class CommunityBookmarkController extends Controller
{
    public function index(
        CommunityEngagementService $engagement,
        CommunityPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->view(app(TenantUser::class), $tenant), 403);

        return response()->json([
            'bookmarks' => CommunityBookmarkResource::collection(
                $engagement->bookmarks($tenant, app(TenantUser::class)),
            ),
        ]);
    }

    public function store(
        StoreCommunityBookmarkRequest $request,
        CommunityMessage $message,
        CommunityEngagementService $engagement,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->bookmark(app(TenantUser::class), $tenant, $message), 403);

        $bookmark = $engagement->bookmark(
            $tenant,
            $message,
            app(TenantUser::class),
            $request->validated()['note'] ?? null,
        );

        return response()->json([
            'message' => 'Message bookmarked.',
            'bookmark' => new CommunityBookmarkResource($bookmark),
        ], 201);
    }

    public function destroy(
        CommunityMessage $message,
        CommunityEngagementService $engagement,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->bookmark(app(TenantUser::class), $tenant, $message), 403);

        $engagement->removeBookmark($tenant, $message, app(TenantUser::class));

        return response()->json(['message' => 'Bookmark removed.']);
    }
}
