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

class LessonTextController extends Controller
{
    public function show(Course $course, CourseSection $section, CourseLesson $lesson): JsonResponse
    {
        $this->authorizeContent($course, $section, $lesson);

        $text = $lesson->text()->firstOrFail();

        return response()->json(['text' => $text]);
    }

    public function store(
        Request $request,
        Course $course,
        CourseSection $section,
        CourseLesson $lesson,
        LessonContentService $content,
    ): JsonResponse {
        $this->authorizeContent($course, $section, $lesson);

        $text = $content->createText($course, $section, $lesson, $this->validateText($request));

        return response()->json([
            'message' => 'Lesson text content created.',
            'text' => $text,
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

        $text = $lesson->text()->firstOrFail();
        $text = $content->updateText($course, $section, $lesson, $text, $this->validateText($request, true));

        return response()->json([
            'message' => 'Lesson text content updated.',
            'text' => $text,
        ]);
    }

    public function destroy(
        Course $course,
        CourseSection $section,
        CourseLesson $lesson,
        LessonContentService $content,
    ): JsonResponse {
        $this->authorizeContent($course, $section, $lesson);

        $text = $lesson->text()->firstOrFail();
        $content->deleteText($course, $section, $lesson, $text);

        return response()->json(['message' => 'Lesson text content deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateText(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'body' => [$partial ? 'sometimes' : 'required', 'string'],
            'format' => [$partial ? 'sometimes' : 'required', Rule::in(['markdown', 'html', 'rich_text_json'])],
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
