<?php

namespace App\Http\Controllers\Api\v1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseModuleResource;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicCourseController extends Controller
{
    /**
     * Public catalog: published, public courses for the current tenant.
     * Optional filters: educational_stage_id, subject_id, instructor_id,
     * pricing_type (free|paid), search, sort, page, per_page.
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $query = Course::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->where('visibility', 'public')
            ->with(['primaryInstructor.user', 'tags', 'categories', 'educationalStage', 'subject'])
            ->withCount(['enrollments', 'sections', 'lessons']);

        if ($stageId = $request->integer('educational_stage_id')) {
            $query->where('educational_stage_id', $stageId);
        }

        if ($subjectId = $request->integer('subject_id')) {
            $query->where('subject_id', $subjectId);
        }

        if ($instructorId = $request->integer('instructor_id')) {
            $query->where(function (Builder $q) use ($instructorId): void {
                $q->where('primary_instructor_tenant_user_id', $instructorId)
                    ->orWhereHas('instructors', fn (Builder $iq) => $iq->where('tenant_user_id', $instructorId));
            });
        }

        if ($search = $request->string('search')->toString()) {
            $search = '%'.$search.'%';
            $query->where(function (Builder $q) use ($search): void {
                $q->where('title', 'like', $search)
                    ->orWhere('short_description', 'like', $search)
                    ->orWhere('slug', 'like', $search)
                    ->orWhereHas('primaryInstructor.user', function (Builder $uq) use ($search): void {
                        $uq->where('name', 'like', $search);
                    });
            });
        }

        match ($request->string('pricing_type')->toString()) {
            'free' => $query->where('pricing_type', 'free'),
            'paid' => $query->whereIn('pricing_type', ['one_time', 'subscription']),
            default => null,
        };

        match ($request->string('sort')->toString()) {
            'alphabetical' => $query->orderBy('title', 'asc'),
            'popular' => $query->orderBy('enrollments_count', 'desc')->orderBy('created_at', 'desc'),
            'price_asc' => $query->orderByRaw('CASE WHEN price_amount IS NULL THEN 1 ELSE 0 END')->orderBy('price_amount', 'asc'),
            'price_desc' => $query->orderByRaw('CASE WHEN price_amount IS NULL THEN 1 ELSE 0 END')->orderBy('price_amount', 'desc'),
            default => $query->orderByRaw('COALESCE(published_at, created_at) desc')->orderBy('created_at', 'desc'),
        };

        $courses = $query->paginate((int) ($request->input('per_page', 12)));

        return response()->json([
            'data' => CourseResource::collection($courses),
            'total' => $courses->total(),
            'per_page' => $courses->perPage(),
            'current_page' => $courses->currentPage(),
            'last_page' => $courses->lastPage(),
            'aggregates' => $this->aggregates($request, $tenantId),
        ]);
    }

    /**
     * Stage-scoped aggregates (independent of the active filters): total courses,
     * distinct teachers and distinct subjects. Used to render the hero stats and
     * the filter options without extra round trips.
     */
    private function aggregates(Request $request, int $tenantId): array
    {
        $query = Course::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->where('visibility', 'public');

        if ($stageId = $request->integer('educational_stage_id')) {
            $query->where('educational_stage_id', $stageId);
        }

        $coursesCount = (clone $query)->count();

        $teachers = (clone $query)
            ->whereNotNull('primary_instructor_tenant_user_id')
            ->with('primaryInstructor.user')
            ->get(['primary_instructor_tenant_user_id'])
            ->groupBy('primary_instructor_tenant_user_id')
            ->map(function ($group) {
                $teacher = $group->first()->primaryInstructor;
                $name = $teacher?->user?->name ?? $teacher?->name;

                return [
                    'id' => (string) $group->first()->primary_instructor_tenant_user_id,
                    'name' => $name ?? 'مدرس',
                    'avatar' => $teacher?->avatar ?? $teacher?->user?->avatar,
                    'specialization' => $teacher?->job_title ?? null,
                    'coursesCount' => $group->count(),
                ];
            })
            ->values();

        $subjects = (clone $query)
            ->whereNotNull('subject_id')
            ->with('subject')
            ->get(['subject_id'])
            ->groupBy('subject_id')
            ->map(function ($group) {
                $subject = $group->first()->subject;

                return [
                    'id' => (string) $group->first()->subject_id,
                    'name' => $subject?->name ?? 'مادة',
                    'coursesCount' => $group->count(),
                ];
            })
            ->values();

        return [
            'coursesCount' => $coursesCount,
            'teachersCount' => $teachers->count(),
            'subjects' => $subjects,
            'teachers' => $teachers,
        ];
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
