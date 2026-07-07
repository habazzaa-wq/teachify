<?php

namespace App\Http\Controllers\Api\v1\Media;

use App\Http\Controllers\Controller;
use App\Models\MediaUploadSession;
use App\Models\TenantUser;
use App\Services\Media\BunnyStreamService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VideoUploadController extends Controller
{
    public function store(Request $request, BunnyStreamService $stream): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => ['nullable', 'integer'],
            'original_filename' => ['required', 'string', 'max:255'],
            'mime_type' => ['nullable', 'string', 'max:255'],
            'size_bytes' => ['nullable', 'integer', 'min:0'],
            'collection' => ['nullable', 'string', 'max:255'],
        ]);

        $membership = app(TenantUser::class);

        if (! $stream->canCreateVideo(currentTenant(), $membership, $validated['course_id'] ?? null)) {
            throw new AuthorizationException('This action is unauthorized.');
        }

        $result = $stream->createUploadIntent(currentTenant(), $membership, $validated);

        return response()->json([
            'message' => 'Video upload intent created.',
            'asset' => $result['asset'],
            'upload_session' => $result['session'],
            'intent' => $result['intent'],
        ], 201);
    }

    public function confirm(Request $request, MediaUploadSession $session, BunnyStreamService $stream): JsonResponse
    {
        abort_if($session->tenant_id !== currentTenant()->id || $session->provider_service !== 'stream', 404);

        $validated = $request->validate([
            'encoding_status' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
            'available_resolutions' => ['nullable', 'array'],
            'thumbnail_url' => ['nullable', 'url'],
            'preview_url' => ['nullable', 'url'],
        ]);

        $membership = app(TenantUser::class);
        $courseId = is_array($session->metadata) ? ($session->metadata['course_id'] ?? null) : null;

        if (! $stream->canCreateVideo(currentTenant(), $membership, $courseId === null ? null : (int) $courseId)) {
            throw new AuthorizationException('This action is unauthorized.');
        }

        $result = $stream->confirmUpload(currentTenant(), $session, $validated);

        return response()->json([
            'message' => 'Video upload confirmed.',
            'asset' => $result['asset'],
            'upload_session' => $result['session'],
            'provider' => $result['provider'],
        ]);
    }
}
