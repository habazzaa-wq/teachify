<?php

namespace App\Http\Controllers\Api\v1\Media;

use App\Http\Controllers\Controller;
use App\Models\MediaAsset;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Media\BunnyStreamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VideoStatusController extends Controller
{
    public function show(
        Request $request,
        MediaAsset $asset,
        BunnyStreamService $stream,
        TenantAuthorizationService $authorization,
    ): JsonResponse {
        abort_if(
            $asset->tenant_id !== currentTenant()->id
            || $asset->provider !== 'bunny'
            || $asset->provider_service !== 'stream'
            || $asset->type !== 'video',
            404,
        );

        $authorization->authorize($request->user(), currentTenant(), 'courses.view');

        return response()->json([
            'asset' => $asset,
            'provider' => $stream->status(currentTenant(), $asset),
        ]);
    }
}
