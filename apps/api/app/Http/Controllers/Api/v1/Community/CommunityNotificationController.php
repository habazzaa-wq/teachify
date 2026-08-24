<?php

namespace App\Http\Controllers\Api\v1\Community;

use App\Http\Controllers\Controller;
use App\Http\Resources\Community\CommunityNotificationResource;
use App\Models\Notification;
use App\Models\TenantUser;
use App\Policies\CommunityPolicy;
use App\Policies\NotificationPolicy;
use App\Services\Notifications\NotificationService;
use Illuminate\Http\JsonResponse;

class CommunityNotificationController extends Controller
{
    public function index(
        NotificationService $notifications,
        CommunityPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();
        $member = app(TenantUser::class);

        abort_unless($policy->view($member, $tenant), 403);

        $page = $notifications->list(
            $tenant,
            $member,
            typePrefix: 'community.',
            perPage: (int) request()->input('per_page', 25),
        );

        return response()->json([
            'notifications' => CommunityNotificationResource::collection($page->items()),
            'total' => $page->total(),
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'per_page' => $page->perPage(),
        ]);
    }

    public function unread(
        NotificationService $notifications,
        CommunityPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();
        $member = app(TenantUser::class);

        abort_unless($policy->view($member, $tenant), 403);

        $page = $notifications->list(
            $tenant,
            $member,
            unreadOnly: true,
            typePrefix: 'community.',
            perPage: (int) request()->input('per_page', 25),
        );

        return response()->json([
            'notifications' => CommunityNotificationResource::collection($page->items()),
            'total' => $page->total(),
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'per_page' => $page->perPage(),
        ]);
    }

    public function read(
        Notification $notification,
        NotificationService $notifications,
        NotificationPolicy $policy,
    ): JsonResponse {
        abort_if($notification->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->viewNotification(app(TenantUser::class), currentTenant(), $notification), 403);

        return response()->json([
            'message' => 'Notification marked as read.',
            'notification' => new CommunityNotificationResource(
                $notifications->markRead(currentTenant(), $notification),
            ),
        ]);
    }

    public function archive(
        Notification $notification,
        NotificationService $notifications,
        NotificationPolicy $policy,
    ): JsonResponse {
        abort_if($notification->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->viewNotification(app(TenantUser::class), currentTenant(), $notification), 403);

        return response()->json([
            'message' => 'Notification archived.',
            'notification' => new CommunityNotificationResource(
                $notifications->archive(currentTenant(), $notification),
            ),
        ]);
    }

}
