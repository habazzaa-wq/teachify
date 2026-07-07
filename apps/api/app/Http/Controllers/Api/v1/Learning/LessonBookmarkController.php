<?php

namespace App\Http\Controllers\Api\v1\Learning;

use App\Http\Controllers\Controller;
use App\Models\CourseLesson;
use App\Models\LessonBookmark;
use App\Models\TenantUser;
use App\Services\Learning\LessonBookmarkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonBookmarkController extends Controller
{
    public function index(CourseLesson $lesson, LessonBookmarkService $bookmarks): JsonResponse
    {
        abort_if($lesson->tenant_id !== currentTenant()->id, 404);

        return response()->json([
            'bookmarks' => $bookmarks->list(currentTenant(), app(TenantUser::class), $lesson),
        ]);
    }

    public function store(Request $request, CourseLesson $lesson, LessonBookmarkService $bookmarks): JsonResponse
    {
        abort_if($lesson->tenant_id !== currentTenant()->id, 404);

        $validated = $request->validate([
            'media_asset_id' => ['nullable', 'integer'],
            'timestamp_seconds' => ['nullable', 'integer', 'min:0'],
            'label' => ['nullable', 'string', 'max:255'],
        ]);

        return response()->json([
            'message' => 'Lesson bookmark created.',
            'bookmark' => $bookmarks->create(currentTenant(), app(TenantUser::class), $lesson, $validated),
        ], 201);
    }

    public function update(Request $request, CourseLesson $lesson, LessonBookmark $bookmark, LessonBookmarkService $bookmarks): JsonResponse
    {
        abort_if($lesson->tenant_id !== currentTenant()->id || $bookmark->tenant_id !== currentTenant()->id, 404);

        $validated = $request->validate([
            'media_asset_id' => ['nullable', 'integer'],
            'timestamp_seconds' => ['nullable', 'integer', 'min:0'],
            'label' => ['nullable', 'string', 'max:255'],
        ]);

        return response()->json([
            'message' => 'Lesson bookmark updated.',
            'bookmark' => $bookmarks->update(currentTenant(), app(TenantUser::class), $lesson, $bookmark, $validated),
        ]);
    }

    public function destroy(CourseLesson $lesson, LessonBookmark $bookmark, LessonBookmarkService $bookmarks): JsonResponse
    {
        abort_if($lesson->tenant_id !== currentTenant()->id || $bookmark->tenant_id !== currentTenant()->id, 404);

        $bookmarks->delete(currentTenant(), app(TenantUser::class), $lesson, $bookmark);

        return response()->json([
            'message' => 'Lesson bookmark deleted.',
        ]);
    }
}
