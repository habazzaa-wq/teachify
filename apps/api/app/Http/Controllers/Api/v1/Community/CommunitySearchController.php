<?php

namespace App\Http\Controllers\Api\v1\Community;

use App\Http\Controllers\Controller;
use App\Http\Requests\Community\CommunitySearchRequest;
use App\Http\Resources\Community\CommunityMessageResource;
use App\Http\Resources\Community\CommunityThreadResource;
use App\Models\CommunityCategory;
use App\Models\TenantUser;
use App\Policies\CommunityPolicy;
use App\Services\Community\CommunityChannelService;
use App\Services\Community\CommunitySearchService;
use Illuminate\Http\JsonResponse;

class CommunitySearchController extends Controller
{
    public function index(
        CommunitySearchRequest $request,
        CommunitySearchService $search,
        CommunityChannelService $channels,
        CommunityPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();
        $member = app(TenantUser::class);

        abort_unless($policy->view($member, $tenant), 403);

        $filters = $request->validated();

        $filters['visible_channel_ids'] = $channels->categories($tenant, $member)
            ->flatMap(fn (CommunityCategory $category) => $category->channels->pluck('id'))
            ->all();

        $results = $search->search($tenant, $member, (string) ($filters['q'] ?? ''), $filters);

        return response()->json([
            'messages' => CommunityMessageResource::collection($results['messages']),
            'threads' => CommunityThreadResource::collection($results['threads']),
        ]);
    }
}
