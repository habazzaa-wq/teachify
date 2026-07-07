<?php

namespace App\Http\Controllers\Api\v1\Media;

use App\Http\Controllers\Controller;
use App\Models\MediaAsset;
use App\Models\TenantUser;
use App\Services\Media\VideoPlaybackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VideoPlaybackController extends Controller
{
    public function play(MediaAsset $asset, VideoPlaybackService $playback): JsonResponse
    {
        abort_if($asset->tenant_id !== currentTenant()->id, 404);

        $result = $playback->start(currentTenant(), app(TenantUser::class), $asset);

        return response()->json([
            'playback_session_token' => $result['session']->session_token,
            'playback' => $result['playback'],
            'expires_at' => $result['session']->expires_at,
        ], 201);
    }

    public function progress(Request $request, string $session, VideoPlaybackService $playback): JsonResponse
    {
        $validated = $request->validate([
            'position_seconds' => ['required', 'integer', 'min:0'],
        ]);

        $playbackSession = $playback->updateProgress(
            currentTenant(),
            app(TenantUser::class),
            $session,
            $validated['position_seconds'],
        );

        return response()->json([
            'message' => 'Playback progress updated.',
            'playback_session' => $playbackSession,
        ]);
    }

    public function close(string $session, VideoPlaybackService $playback): JsonResponse
    {
        $playbackSession = $playback->close(currentTenant(), app(TenantUser::class), $session);

        return response()->json([
            'message' => 'Playback session closed.',
            'playback_session' => $playbackSession,
        ]);
    }
}
