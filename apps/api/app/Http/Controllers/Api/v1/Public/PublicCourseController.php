<?php

namespace App\Http\Controllers\Api\v1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseLessonResource;
use App\Http\Resources\CourseModuleResource;
use App\Http\Resources\CourseResource;
use App\Http\Resources\CourseSectionResource;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PublicCourseController extends Controller
{
    public function index(): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $courses = Course::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->where('visibility', 'public')
            ->with(['primaryInstructor.user', 'tags', 'categories'])
            ->withCount(['enrollments', 'sections', 'lessons'])
            ->orderByDesc('featured')
            ->orderByRaw('COALESCE(published_at, created_at) DESC')
            ->limit(12)
            ->get();

        return response()->json([
            'data' => CourseResource::collection($courses),
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $course = Course::query()
            ->where('tenant_id', $tenantId)
            ->where('slug', $slug)
            ->where('status', 'published')
            ->where('visibility', 'public')
            ->with([
                'primaryInstructor.user',
                'tags',
                'categories',
                'modules.sections.lessons.files',
                'modules.sections.lessons.exam',
                'modules.sections.quizzes',
            ])
            ->withCount(['enrollments', 'sections', 'lessons'])
            ->firstOrFail();

        return response()->json([
            'data' => new CourseResource($course),
        ]);
    }

    public function modules(string $slug): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $course = Course::query()
            ->where('tenant_id', $tenantId)
            ->where('slug', $slug)
            ->where('status', 'published')
            ->where('visibility', 'public')
            ->firstOrFail();

        $modules = $course->modules()
            ->with(['sections.lessons'])
            ->orderBy('order')
            ->get();

        return response()->json([
            'data' => CourseModuleResource::collection($modules),
        ]);
    }

    public function related(string $slug): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $course = Course::query()
            ->where('tenant_id', $tenantId)
            ->where('slug', $slug)
            ->where('status', 'published')
            ->where('visibility', 'public')
            ->firstOrFail();

        $categoryIds = $course->categories()->pluck('categories.id');

        $related = Course::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->where('visibility', 'public')
            ->where('courses.id', '!=', $course->id)
            ->whereHas('categories', function ($query) use ($categoryIds) {
                $query->whereIn('categories.id', $categoryIds);
            })
            ->with(['primaryInstructor.user', 'tags', 'categories'])
            ->withCount(['enrollments', 'sections', 'lessons'])
            ->limit(6)
            ->get();

        return response()->json([
            'data' => CourseResource::collection($related),
        ]);
    }
}
