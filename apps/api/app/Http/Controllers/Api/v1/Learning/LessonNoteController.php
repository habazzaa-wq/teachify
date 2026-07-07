<?php

namespace App\Http\Controllers\Api\v1\Learning;

use App\Http\Controllers\Controller;
use App\Models\CourseLesson;
use App\Models\LessonNote;
use App\Models\TenantUser;
use App\Services\Learning\LessonNoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonNoteController extends Controller
{
    public function index(CourseLesson $lesson, LessonNoteService $notes): JsonResponse
    {
        abort_if($lesson->tenant_id !== currentTenant()->id, 404);

        return response()->json([
            'notes' => $notes->list(currentTenant(), app(TenantUser::class), $lesson),
        ]);
    }

    public function store(Request $request, CourseLesson $lesson, LessonNoteService $notes): JsonResponse
    {
        abort_if($lesson->tenant_id !== currentTenant()->id, 404);

        $validated = $request->validate([
            'media_asset_id' => ['nullable', 'integer'],
            'timestamp_seconds' => ['nullable', 'integer', 'min:0'],
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string'],
        ]);

        return response()->json([
            'message' => 'Lesson note created.',
            'note' => $notes->create(currentTenant(), app(TenantUser::class), $lesson, $validated),
        ], 201);
    }

    public function update(Request $request, CourseLesson $lesson, LessonNote $note, LessonNoteService $notes): JsonResponse
    {
        abort_if($lesson->tenant_id !== currentTenant()->id || $note->tenant_id !== currentTenant()->id, 404);

        $validated = $request->validate([
            'media_asset_id' => ['nullable', 'integer'],
            'timestamp_seconds' => ['nullable', 'integer', 'min:0'],
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['sometimes', 'required', 'string'],
        ]);

        return response()->json([
            'message' => 'Lesson note updated.',
            'note' => $notes->update(currentTenant(), app(TenantUser::class), $lesson, $note, $validated),
        ]);
    }

    public function destroy(CourseLesson $lesson, LessonNote $note, LessonNoteService $notes): JsonResponse
    {
        abort_if($lesson->tenant_id !== currentTenant()->id || $note->tenant_id !== currentTenant()->id, 404);

        $notes->delete(currentTenant(), app(TenantUser::class), $lesson, $note);

        return response()->json([
            'message' => 'Lesson note deleted.',
        ]);
    }
}
