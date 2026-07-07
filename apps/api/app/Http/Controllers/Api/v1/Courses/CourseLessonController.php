<?php

namespace App\Http\Controllers\Api\v1\Courses;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseLessonResource;
use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Services\Courses\CourseLessonService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CourseLessonController extends Controller
{
    public function __construct(
        private readonly CourseLessonService $service,
    ) {}

    public function index(Course $course, CourseSection $section): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureSectionInCourse($course, $section);
        Gate::authorize('viewAny', CourseLesson::class);

        $lessons = $this->service->list($course, $section, request()->all());

        return response()->json([
            'data' => CourseLessonResource::collection($lessons),
            'total' => $lessons->total(),
            'per_page' => $lessons->perPage(),
            'current_page' => $lessons->currentPage(),
            'last_page' => $lessons->lastPage(),
        ]);
    }

    public function store(Request $request, Course $course, CourseSection $section): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureSectionInCourse($course, $section);
        Gate::authorize('create', CourseLesson::class);

        $lesson = $this->service->create($course, $section, $this->validateLesson($request));

        return response()->json([
            'message' => 'تم إنشاء الدرس بنجاح.',
            'data' => new CourseLessonResource($lesson),
        ], 201);
    }

    public function show(Course $course, CourseSection $section, CourseLesson $lesson): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureLessonInSection($course, $section, $lesson);
        Gate::authorize('view', $lesson);

        return response()->json([
            'data' => new CourseLessonResource($lesson->loadMissing(['course:id,title,slug', 'section:id,title,slug'])),
        ]);
    }

    public function update(Request $request, Course $course, CourseSection $section, CourseLesson $lesson): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureLessonInSection($course, $section, $lesson);
        Gate::authorize('update', $lesson);

        $lesson = $this->service->update($course, $section, $lesson, $this->validateLesson($request, true));

        return response()->json([
            'message' => 'تم تحديث الدرس بنجاح.',
            'data' => new CourseLessonResource($lesson),
        ]);
    }

    public function destroy(Course $course, CourseSection $section, CourseLesson $lesson): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureLessonInSection($course, $section, $lesson);
        Gate::authorize('delete', $lesson);

        $this->service->delete($course, $section, $lesson);

        return response()->json(['message' => 'تم حذف الدرس بنجاح.']);
    }

    public function restore(Course $course, CourseSection $section, int $lesson): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureSectionInCourse($course, $section);
        Gate::authorize('restore', CourseLesson::class);

        $lesson = $this->service->restore($course, $section, $lesson);

        if (! $lesson) {
            return response()->json(['message' => 'الدرس غير موجود.'], 404);
        }

        return response()->json([
            'message' => 'تم استعادة الدرس بنجاح.',
            'data' => new CourseLessonResource($lesson),
        ]);
    }

    public function duplicate(Course $course, CourseSection $section, CourseLesson $lesson): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureLessonInSection($course, $section, $lesson);
        Gate::authorize('create', CourseLesson::class);

        $newLesson = $this->service->duplicate($course, $section, $lesson);

        return response()->json([
            'message' => 'تم نسخ الدرس بنجاح.',
            'data' => new CourseLessonResource($newLesson),
        ], 201);
    }

    public function updateStatus(Request $request, Course $course, CourseSection $section, CourseLesson $lesson): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureLessonInSection($course, $section, $lesson);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['draft', 'review', 'published', 'scheduled', 'archived'])],
        ]);

        if ($validated['status'] === 'published') {
            Gate::authorize('publish', $lesson);
        } elseif ($validated['status'] === 'archived') {
            Gate::authorize('archive', $lesson);
        } else {
            Gate::authorize('update', $lesson);
        }

        $lesson = $this->service->changeStatus($course, $section, $lesson, $validated['status']);

        return response()->json([
            'message' => 'تم تحديث حالة الدرس.',
            'data' => new CourseLessonResource($lesson),
        ]);
    }

    public function publish(Course $course, CourseSection $section, CourseLesson $lesson): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureLessonInSection($course, $section, $lesson);
        Gate::authorize('publish', $lesson);

        $lesson = $this->service->publish($course, $section, $lesson);

        return response()->json([
            'message' => 'تم نشر الدرس بنجاح.',
            'data' => new CourseLessonResource($lesson),
        ]);
    }

    public function archive(Course $course, CourseSection $section, CourseLesson $lesson): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureLessonInSection($course, $section, $lesson);
        Gate::authorize('archive', $lesson);

        $lesson = $this->service->archive($course, $section, $lesson);

        return response()->json([
            'message' => 'تم أرشفة الدرس بنجاح.',
            'data' => new CourseLessonResource($lesson),
        ]);
    }

    public function feature(Course $course, CourseSection $section, CourseLesson $lesson): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureLessonInSection($course, $section, $lesson);
        Gate::authorize('feature', $lesson);

        $lesson = $this->service->toggleFeatured($course, $section, $lesson);

        return response()->json([
            'message' => $lesson->featured ? 'تم تمييز الدرس.' : 'تم إلغاء تمييز الدرس.',
            'data' => new CourseLessonResource($lesson),
        ]);
    }

    public function freePreview(Course $course, CourseSection $section, CourseLesson $lesson): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureLessonInSection($course, $section, $lesson);
        Gate::authorize('update', $lesson);

        $lesson = $this->service->toggleFreePreview($course, $section, $lesson);

        return response()->json([
            'message' => $lesson->free_preview ? 'تم تفعيل المعاينة المجانية.' : 'تم إلغاء المعاينة المجانية.',
            'data' => new CourseLessonResource($lesson),
        ]);
    }

    public function reorder(Request $request, Course $course, CourseSection $section): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureSectionInCourse($course, $section);
        Gate::authorize('reorder', CourseLesson::class);

        $validated = $request->validate([
            'lessons' => ['required', 'array', 'min:1'],
            'lessons.*.id' => ['required', 'integer'],
            'lessons.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        $this->service->reorder($course, $section, $validated['lessons']);

        return response()->json(['message' => 'تم إعادة ترتيب الدروس بنجاح.']);
    }

    public function move(Request $request, Course $course, CourseSection $section, CourseLesson $lesson): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureLessonInSection($course, $section, $lesson);
        Gate::authorize('update', $lesson);

        $validated = $request->validate([
            'course_section_id' => ['required', 'integer'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $lesson = $this->service->move(
            $course,
            $section,
            $lesson,
            $validated['course_section_id'],
            $validated['sort_order'] ?? null,
        );

        return response()->json([
            'message' => 'تم نقل الدرس بنجاح.',
            'data' => new CourseLessonResource($lesson),
        ]);
    }

    public function metrics(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', CourseLesson::class);

        $courseId = $request->input('course_id');
        $sectionId = $request->input('section_id');
        $course = $courseId ? Course::find((int) $courseId) : null;
        $section = $sectionId ? CourseSection::find((int) $sectionId) : null;

        return response()->json([
            'data' => $this->service->getMetrics($course, $section),
        ]);
    }

    public function export(Course $course, CourseSection $section): StreamedResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureSectionInCourse($course, $section);
        Gate::authorize('viewAny', CourseLesson::class);

        return $this->service->exportCsv($course, $section);
    }

    private function validateLesson(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$required, 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'alpha_dash:ascii'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'lesson_type' => [$required, Rule::in(['video', 'text', 'pdf', 'external', 'live'])],
            'status' => ['sometimes', Rule::in(['draft', 'review', 'published', 'scheduled', 'archived'])],
            'visibility' => ['sometimes', Rule::in(['private', 'preview', 'public'])],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
            'estimated_duration' => ['nullable', 'integer', 'min:0'],
            'free_preview' => ['sometimes', 'boolean'],
            'downloadable' => ['sometimes', 'boolean'],
            'featured' => ['sometimes', 'boolean'],
            'comments_enabled' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:20'],
            'icon' => ['nullable', 'string', 'max:100'],
        ]);
    }

    private function ensureCourseInTenant(Course $course): void
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
    }

    private function ensureSectionInCourse(Course $course, CourseSection $section): void
    {
        abort_if($section->tenant_id !== currentTenant()->id, 404);
        abort_if($section->tenant_id !== $course->tenant_id || $section->course_id !== $course->id, 404);
    }

    private function ensureLessonInSection(Course $course, CourseSection $section, CourseLesson $lesson): void
    {
        $this->ensureSectionInCourse($course, $section);
        abort_if($lesson->tenant_id !== currentTenant()->id, 404);
        abort_if(
            $lesson->tenant_id !== $course->tenant_id
            || $lesson->course_id !== $course->id
            || $lesson->course_section_id !== $section->id,
            404,
        );
    }
}
