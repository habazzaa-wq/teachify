<?php

namespace App\Http\Controllers\Api\v1\Notifications;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\TenantUser;
use App\Policies\NotificationPolicy;
use App\Services\Notifications\NotificationService;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function index(NotificationService $notifications): JsonResponse
    {
        return response()->json([
            'notifications' => $notifications->list(currentTenant(), app(TenantUser::class)),
        ]);
    }

    public function unread(NotificationService $notifications): JsonResponse
    {
        return response()->json([
            'notifications' => $notifications->list(currentTenant(), app(TenantUser::class), true),
        ]);
    }

    public function read(Notification $notification, NotificationService $notifications, NotificationPolicy $policy): JsonResponse
    {
        abort_if($notification->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->viewNotification(app(TenantUser::class), currentTenant(), $notification), 403);

        return response()->json([
            'message' => 'Notification marked as read.',
            'notification' => $notifications->markRead(currentTenant(), $notification),
        ]);
    }

    public function archive(Notification $notification, NotificationService $notifications, NotificationPolicy $policy): JsonResponse
    {
        abort_if($notification->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->viewNotification(app(TenantUser::class), currentTenant(), $notification), 403);

        return response()->json([
            'message' => 'Notification archived.',
            'notification' => $notifications->archive(currentTenant(), $notification),
        ]);
    }
}
