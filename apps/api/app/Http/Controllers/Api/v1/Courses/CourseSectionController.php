<?php

namespace App\Http\Controllers\Api\v1\Courses;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseSectionResource;
use App\Models\Course;
use App\Models\CourseSection;
use App\Services\Courses\CourseSectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CourseSectionController extends Controller
{
    public function __construct(
        private readonly CourseSectionService $service,
    ) {}

    public function index(Course $course): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        Gate::authorize('viewAny', CourseSection::class);

        $sections = $this->service->list($course, request()->all(), true);

        return response()->json([
            'data' => CourseSectionResource::collection($sections),
            'total' => $sections->total(),
            'per_page' => $sections->perPage(),
            'current_page' => $sections->currentPage(),
            'last_page' => $sections->lastPage(),
        ]);
    }

    public function store(Request $request, Course $course): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        Gate::authorize('create', CourseSection::class);

        $section = $this->service->create($course, $this->validateSection($request));

        return response()->json([
            'message' => 'Course section created successfully.',
            'data' => new CourseSectionResource($section),
        ], 201);
    }

    public function show(Course $course, CourseSection $section): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureSectionInCourse($course, $section);
        Gate::authorize('view', $section);

        return response()->json([
            'data' => new CourseSectionResource($section->loadCount('lessons')),
        ]);
    }

    public function update(Request $request, Course $course, CourseSection $section): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureSectionInCourse($course, $section);
        Gate::authorize('update', $section);

        $section = $this->service->update($course, $section, $this->validateSection($request, true));

        return response()->json([
            'message' => 'Course section updated successfully.',
            'data' => new CourseSectionResource($section),
        ]);
    }

    public function destroy(Course $course, CourseSection $section): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureSectionInCourse($course, $section);
        Gate::authorize('delete', $section);

        $this->service->delete($course, $section);

        return response()->json(['message' => 'Course section deleted successfully.']);
    }

    public function restore(Course $course, int $section): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        Gate::authorize('restore', CourseSection::class);

        $section = $this->service->restore($course, $section);

        if (! $section) {
            return response()->json(['message' => 'Section not found.'], 404);
        }

        return response()->json([
            'message' => 'Course section restored successfully.',
            'data' => new CourseSectionResource($section),
        ]);
    }

    public function duplicate(Course $course, CourseSection $section): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureSectionInCourse($course, $section);
        Gate::authorize('create', CourseSection::class);

        $newSection = $this->service->duplicate($course, $section);

        return response()->json([
            'message' => 'Course section duplicated successfully.',
            'data' => new CourseSectionResource($newSection),
        ], 201);
    }

    public function updateStatus(Request $request, Course $course, CourseSection $section): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureSectionInCourse($course, $section);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
        ]);

        if ($validated['status'] === 'published') {
            Gate::authorize('publish', $section);
        } else {
            Gate::authorize('update', $section);
        }

        $section = $this->service->changeStatus($course, $section, $validated['status']);

        return response()->json([
            'message' => 'Course section status updated.',
            'data' => new CourseSectionResource($section),
        ]);
    }

    public function publish(Course $course, CourseSection $section): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureSectionInCourse($course, $section);
        Gate::authorize('publish', $section);

        $section = $this->service->publish($course, $section);

        return response()->json([
            'message' => 'Course section published successfully.',
            'data' => new CourseSectionResource($section),
        ]);
    }

    public function unpublish(Course $course, CourseSection $section): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureSectionInCourse($course, $section);
        Gate::authorize('update', $section);

        $section = $this->service->unpublish($course, $section);

        return response()->json([
            'message' => 'Course section unpublished successfully.',
            'data' => new CourseSectionResource($section),
        ]);
    }

    public function archive(Course $course, CourseSection $section): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureSectionInCourse($course, $section);
        Gate::authorize('update', $section);

        $section = $this->service->changeStatus($course, $section, 'archived');

        return response()->json([
            'message' => 'Course section archived successfully.',
            'data' => new CourseSectionResource($section),
        ]);
    }

    public function move(Request $request, Course $course, CourseSection $section): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureSectionInCourse($course, $section);
        Gate::authorize('update', $section);

        $validated = $request->validate([
            'course_module_id' => ['required', 'nullable', 'integer'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $section = $this->service->move(
            $course,
            $section,
            $validated['course_module_id'] ?? null,
            $validated['sort_order'] ?? null,
        );

        return response()->json([
            'message' => 'Course section moved successfully.',
            'data' => new CourseSectionResource($section),
        ]);
    }

    public function toggleLock(Course $course, CourseSection $section): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureSectionInCourse($course, $section);
        Gate::authorize('update', $section);

        $section = $this->service->toggleLocked($course, $section);

        return response()->json([
            'message' => $section->locked ? 'Course section locked.' : 'Course section unlocked.',
            'data' => new CourseSectionResource($section),
        ]);
    }

    public function toggleFeature(Course $course, CourseSection $section): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureSectionInCourse($course, $section);
        Gate::authorize('feature', $section);

        $section = $this->service->toggleFeatured($course, $section);

        return response()->json([
            'message' => $section->featured ? 'Course section featured.' : 'Course section unfeatured.',
            'data' => new CourseSectionResource($section),
        ]);
    }

    public function reorder(Request $request, Course $course): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        Gate::authorize('reorder', CourseSection::class);

        $validated = $request->validate([
            'sections' => ['required', 'array', 'min:1'],
            'sections.*.id' => ['required', 'integer'],
            'sections.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        $this->service->reorder($course, $validated['sections']);

        return response()->json(['message' => 'Course sections reordered.']);
    }

    public function metrics(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', CourseSection::class);

        $courseId = $request->input('course_id');
        $course = $courseId ? Course::find((int) $courseId) : null;

        return response()->json([
            'data' => $this->service->getMetrics($course),
        ]);
    }

    public function export(Course $course): StreamedResponse
    {
        $this->ensureCourseInTenant($course);
        Gate::authorize('viewAny', CourseSection::class);

        return $this->service->exportCsv($course);
    }

    private function validateSection(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$required, 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'alpha_dash:ascii'],
            'description' => ['nullable', 'string'],
            'course_module_id' => ['sometimes', 'nullable', 'integer', 'exists:course_modules,id'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
            'free_preview' => ['sometimes', 'boolean'],
            'locked' => ['sometimes', 'boolean'],
            'featured' => ['sometimes', 'boolean'],
            'color' => ['nullable', 'string', 'max:20'],
            'icon' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
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
}
