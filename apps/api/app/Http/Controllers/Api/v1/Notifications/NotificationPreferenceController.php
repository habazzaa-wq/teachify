<?php

namespace App\Http\Controllers\Api\v1\Notifications;

use App\Http\Controllers\Controller;
use App\Models\TenantUser;
use App\Services\Notifications\NotificationPreferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    public function index(NotificationPreferenceService $preferences): JsonResponse
    {
        return response()->json([
            'preferences' => $preferences->list(currentTenant(), app(TenantUser::class)),
        ]);
    }

    public function update(Request $request, NotificationPreferenceService $preferences): JsonResponse
    {
        $validated = $request->validate([
            'preferences' => ['required', 'array'],
            'preferences.*.notification_type' => ['required', 'string', 'max:255'],
            'preferences.*.in_app_enabled' => ['sometimes', 'boolean'],
            'preferences.*.email_enabled' => ['sometimes', 'boolean'],
        ]);

        return response()->json([
            'message' => 'Notification preferences updated.',
            'preferences' => $preferences->updateMany(currentTenant(), app(TenantUser::class), $validated['preferences']),
        ]);
    }
}
