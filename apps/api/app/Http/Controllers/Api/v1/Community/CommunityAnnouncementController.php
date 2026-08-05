<?php

namespace App\Http\Controllers\Api\v1\Community;

use App\Http\Controllers\Controller;
use App\Http\Requests\Community\StoreCommunityAnnouncementRequest;
use App\Http\Requests\Community\UpdateCommunityAnnouncementRequest;
use App\Http\Resources\Community\CommunityAnnouncementResource;
use App\Models\CommunityAnnouncement;
use App\Models\TenantUser;
use App\Policies\CommunityAnnouncementPolicy;
use App\Services\Community\CommunityAnnouncementService;
use Illuminate\Http\JsonResponse;

class CommunityAnnouncementController extends Controller
{
    public function index(
        CommunityAnnouncementService $announcements,
        CommunityAnnouncementPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();
        $member = app(TenantUser::class);

        abort_unless($policy->view($member, $tenant), 403);

        return response()->json([
            'announcements' => CommunityAnnouncementResource::collection(
                $announcements->list($tenant, $member, $policy->manage($member, $tenant)),
            ),
        ]);
    }

    public function store(
        StoreCommunityAnnouncementRequest $request,
        CommunityAnnouncementService $announcements,
        CommunityAnnouncementPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->manage(app(TenantUser::class), $tenant), 403);

        return response()->json([
            'message' => 'Announcement created.',
            'announcement' => new CommunityAnnouncementResource(
                $announcements->create($tenant, app(TenantUser::class), $request->validated()),
            ),
        ], 201);
    }

    public function show(
        CommunityAnnouncement $announcement,
        CommunityAnnouncementService $announcements,
        CommunityAnnouncementPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->view(app(TenantUser::class), $tenant, $announcement), 403);

        return response()->json([
            'announcement' => new CommunityAnnouncementResource($announcements->show($tenant, $announcement)),
        ]);
    }

    public function update(
        UpdateCommunityAnnouncementRequest $request,
        CommunityAnnouncement $announcement,
        CommunityAnnouncementService $announcements,
        CommunityAnnouncementPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->manage(app(TenantUser::class), $tenant), 403);

        return response()->json([
            'message' => 'Announcement updated.',
            'announcement' => new CommunityAnnouncementResource(
                $announcements->update($tenant, $announcement, app(TenantUser::class), $request->validated()),
            ),
        ]);
    }

    public function publish(
        CommunityAnnouncement $announcement,
        CommunityAnnouncementService $announcements,
        CommunityAnnouncementPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->manage(app(TenantUser::class), $tenant), 403);

        return response()->json([
            'message' => 'Announcement published.',
            'announcement' => new CommunityAnnouncementResource(
                $announcements->publish($tenant, $announcement, app(TenantUser::class)),
            ),
        ]);
    }

    public function destroy(
        CommunityAnnouncement $announcement,
        CommunityAnnouncementService $announcements,
        CommunityAnnouncementPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->manage(app(TenantUser::class), $tenant), 403);

        $announcements->delete($tenant, $announcement, app(TenantUser::class));

        return response()->json(['message' => 'Announcement deleted.']);
    }
}
