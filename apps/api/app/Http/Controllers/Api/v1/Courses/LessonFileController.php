<?php

namespace App\Http\Controllers\Api\v1\Courses;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\LessonFile;
use App\Services\Courses\LessonContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class LessonFileController extends Controller
{
    public function index(Course $course, CourseSection $section, CourseLesson $lesson): JsonResponse
    {
        $this->authorizeContent($course, $section, $lesson);

        return response()->json([
            'files' => $lesson->files()->with('mediaAsset')->orderBy('sort_order')->orderBy('id')->get(),
        ]);
    }

    public function store(
        Request $request,
        Course $course,
        CourseSection $section,
        CourseLesson $lesson,
        LessonContentService $content,
    ): JsonResponse {
        $this->authorizeContent($course, $section, $lesson);

        $file = $content->createFile($course, $section, $lesson, $this->validateFile($request));

        return response()->json([
            'message' => 'Lesson file content created.',
            'file' => $file,
        ], 201);
    }

    public function update(
        Request $request,
        Course $course,
        CourseSection $section,
        CourseLesson $lesson,
        LessonFile $file,
        LessonContentService $content,
    ): JsonResponse {
        $this->authorizeContent($course, $section, $lesson);
        $this->ensureFileInLesson($course, $section, $lesson, $file);

        $file = $content->updateFile($course, $section, $lesson, $file, $this->validateFile($request, true));

        return response()->json([
            'message' => 'Lesson file content updated.',
            'file' => $file,
        ]);
    }

    public function destroy(
        Course $course,
        CourseSection $section,
        CourseLesson $lesson,
        LessonFile $file,
        LessonContentService $content,
    ): JsonResponse {
        $this->authorizeContent($course, $section, $lesson);
        $this->ensureFileInLesson($course, $section, $lesson, $file);

        $content->deleteFile($course, $section, $lesson, $file);

        return response()->json(['message' => 'Lesson file content deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateFile(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'media_asset_id' => [$partial ? 'sometimes' : 'required', 'integer'],
            'title' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'download_enabled' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
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

    private function ensureFileInLesson(Course $course, CourseSection $section, CourseLesson $lesson, LessonFile $file): void
    {
        abort_if($file->tenant_id !== currentTenant()->id, 404);
        abort_if(
            $file->tenant_id !== $course->tenant_id
            || $file->course_id !== $course->id
            || $file->course_section_id !== $section->id
            || $file->course_lesson_id !== $lesson->id,
            404,
        );
    }
}
