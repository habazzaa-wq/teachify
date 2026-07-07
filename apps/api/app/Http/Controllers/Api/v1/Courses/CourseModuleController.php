<?php

namespace App\Http\Controllers\Api\v1\Courses;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseModuleResource;
use App\Models\Course;
use App\Models\CourseModule;
use App\Services\Courses\CourseModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CourseModuleController extends Controller
{
    public function __construct(
        private readonly CourseModuleService $service,
    ) {}

    public function index(Course $course): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        Gate::authorize('viewAny', CourseModule::class);

        $modules = $this->service->list($course, request()->all());

        return response()->json([
            'data' => CourseModuleResource::collection($modules),
            'total' => $modules->total(),
            'per_page' => $modules->perPage(),
            'current_page' => $modules->currentPage(),
            'last_page' => $modules->lastPage(),
        ]);
    }

    public function store(Request $request, Course $course): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        Gate::authorize('create', CourseModule::class);

        $module = $this->service->create($course, $this->validateModule($request));

        return response()->json([
            'message' => 'Course module created successfully.',
            'data' => new CourseModuleResource($module),
        ], 201);
    }

    public function show(Course $course, CourseModule $module): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureModuleInCourse($course, $module);
        Gate::authorize('view', $module);

        return response()->json([
            'data' => new CourseModuleResource($module->loadCount('sections')),
        ]);
    }

    public function update(Request $request, Course $course, CourseModule $module): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureModuleInCourse($course, $module);
        Gate::authorize('update', $module);

        $module = $this->service->update($course, $module, $this->validateModule($request, true));

        return response()->json([
            'message' => 'Course module updated successfully.',
            'data' => new CourseModuleResource($module),
        ]);
    }

    public function destroy(Course $course, CourseModule $module): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureModuleInCourse($course, $module);
        Gate::authorize('delete', $module);

        $this->service->delete($course, $module);

        return response()->json(['message' => 'Course module deleted successfully.']);
    }

    public function restore(Course $course, int $module): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        Gate::authorize('restore', CourseModule::class);

        $module = $this->service->restore($course, $module);

        if (! $module) {
            return response()->json(['message' => 'Module not found.'], 404);
        }

        return response()->json([
            'message' => 'Course module restored successfully.',
            'data' => new CourseModuleResource($module),
        ]);
    }

    public function duplicate(Course $course, CourseModule $module): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureModuleInCourse($course, $module);
        Gate::authorize('create', CourseModule::class);

        $newModule = $this->service->duplicate($course, $module);

        return response()->json([
            'message' => 'Course module duplicated successfully.',
            'data' => new CourseModuleResource($newModule),
        ], 201);
    }

    public function updateStatus(Request $request, Course $course, CourseModule $module): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureModuleInCourse($course, $module);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
        ]);

        if ($validated['status'] === 'published') {
            Gate::authorize('publish', $module);
        } else {
            Gate::authorize('update', $module);
        }

        $module = $this->service->changeStatus($course, $module, $validated['status']);

        return response()->json([
            'message' => 'Course module status updated.',
            'data' => new CourseModuleResource($module),
        ]);
    }

    public function publish(Course $course, CourseModule $module): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureModuleInCourse($course, $module);
        Gate::authorize('publish', $module);

        $module = $this->service->publish($course, $module);

        return response()->json([
            'message' => 'Course module published successfully.',
            'data' => new CourseModuleResource($module),
        ]);
    }

    public function archive(Course $course, CourseModule $module): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureModuleInCourse($course, $module);
        Gate::authorize('archive', $module);

        $module = $this->service->archive($course, $module);

        return response()->json([
            'message' => 'Course module archived successfully.',
            'data' => new CourseModuleResource($module),
        ]);
    }

    public function toggleFeature(Course $course, CourseModule $module): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        $this->ensureModuleInCourse($course, $module);
        Gate::authorize('feature', $module);

        $module = $this->service->toggleFeatured($course, $module);

        return response()->json([
            'message' => $module->featured ? 'Course module featured.' : 'Course module unfeatured.',
            'data' => new CourseModuleResource($module),
        ]);
    }

    public function reorder(Request $request, Course $course): JsonResponse
    {
        $this->ensureCourseInTenant($course);
        Gate::authorize('reorder', CourseModule::class);

        $validated = $request->validate([
            'modules' => ['required', 'array', 'min:1'],
            'modules.*.id' => ['required', 'integer'],
            'modules.*.order' => ['required', 'integer', 'min:0'],
        ]);

        $this->service->reorder($course, $validated['modules']);

        return response()->json(['message' => 'Course modules reordered.']);
    }

    public function metrics(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', CourseModule::class);

        $courseId = $request->input('course_id');
        $course = $courseId ? Course::find((int) $courseId) : null;

        return response()->json([
            'data' => $this->service->getMetrics($course),
        ]);
    }

    public function export(Course $course): StreamedResponse
    {
        $this->ensureCourseInTenant($course);
        Gate::authorize('viewAny', CourseModule::class);

        return $this->service->exportCsv($course);
    }

    private function validateModule(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$required, 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'alpha_dash:ascii'],
            'description' => ['nullable', 'string'],
            'order' => ['sometimes', 'integer', 'min:0'],
            'estimated_duration' => ['nullable', 'integer', 'min:0'],
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

    private function ensureModuleInCourse(Course $course, CourseModule $module): void
    {
        abort_if($module->tenant_id !== currentTenant()->id, 404);
        abort_if($module->tenant_id !== $course->tenant_id || $module->course_id !== $course->id, 404);
    }
}
