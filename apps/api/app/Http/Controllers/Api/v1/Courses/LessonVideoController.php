<?php

namespace App\Http\Controllers\Api\v1\Courses;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Services\Courses\LessonContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class LessonVideoController extends Controller
{
    public function show(Course $course, CourseSection $section, CourseLesson $lesson): JsonResponse
    {
        $this->authorizeContent($course, $section, $lesson);

        $video = $lesson->video()->with(['mediaAsset', 'thumbnailMediaAsset'])->firstOrFail();

        return response()->json(['video' => $video]);
    }

    public function store(
        Request $request,
        Course $course,
        CourseSection $section,
        CourseLesson $lesson,
        LessonContentService $content,
    ): JsonResponse {
        $this->authorizeContent($course, $section, $lesson);

        $video = $content->createVideo($course, $section, $lesson, $this->validateVideo($request));

        return response()->json([
            'message' => 'Lesson video content created.',
            'video' => $video,
        ], 201);
    }

    public function update(
        Request $request,
        Course $course,
        CourseSection $section,
        CourseLesson $lesson,
        LessonContentService $content,
    ): JsonResponse {
        $this->authorizeContent($course, $section, $lesson);

        $video = $lesson->video()->firstOrFail();
        $video = $content->updateVideo($course, $section, $lesson, $video, $this->validateVideo($request, true));

        return response()->json([
            'message' => 'Lesson video content updated.',
            'video' => $video,
        ]);
    }

    public function destroy(
        Course $course,
        CourseSection $section,
        CourseLesson $lesson,
        LessonContentService $content,
    ): JsonResponse {
        $this->authorizeContent($course, $section, $lesson);

        $video = $lesson->video()->firstOrFail();
        $content->deleteVideo($course, $section, $lesson, $video);

        return response()->json(['message' => 'Lesson video content deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateVideo(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'media_asset_id' => [$partial ? 'sometimes' : 'required', 'integer'],
            'thumbnail_media_asset_id' => ['nullable', 'integer'],
            'processing_status' => ['sometimes', Rule::in(['pending', 'uploading', 'processing', 'ready', 'failed', 'deleted'])],
            'playback_policy' => ['sometimes', Rule::in(['private', 'enrolled_only', 'public'])],
            'metadata' => ['sometimes', 'array'],
        ]);
    }

    private function authorizeContent(Course $course, CourseSection $section, CourseLesson $lesson): void
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        abort_if($section->tenant_id !== currentTenant()->id, 404);
        abort_if($lesson->tenant_id !== currentTenant()->id, 404);
        abort_if($section->course_id !== $course->id || $lesson->course_id !== $course->id || $lesson->course_section_id !== $section->id, 404);

        Gate::authorize('update', $course);
    }
}
