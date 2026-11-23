<?php

namespace App\Http\Controllers\Api\v1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseModuleResource;
use App\Http\Resources\PublicCourseResource;
use App\Models\Course;
use App\Models\Subject;
use App\Models\TenantUser;
use App\Support\Pagination;
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
            ->with(['primaryInstructor.user', 'instructors.membership.user', 'tags', 'categories', 'educationalStage', 'subject'])
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
            'paid' => $query->where('pricing_type', '!=', 'free'),
            default => null,
        };

        match ($request->string('sort')->toString()) {
            'alphabetical' => $query->orderBy('title', 'asc'),
            'popular' => $query->orderBy('enrollments_count', 'desc')->orderBy('created_at', 'desc'),
            'price_asc' => $query->orderByRaw('CASE WHEN price_amount IS NULL THEN 1 ELSE 0 END')->orderBy('price_amount', 'asc'),
            'price_desc' => $query->orderByRaw('CASE WHEN price_amount IS NULL THEN 1 ELSE 0 END')->orderBy('price_amount', 'desc'),
            default => $query->orderByRaw('COALESCE(published_at, created_at) desc')->orderBy('created_at', 'desc'),
        };

        $courses = $query->paginate(Pagination::perPage($request->input('per_page'), 12, 48));

        return response()->json([
            'data' => PublicCourseResource::collection($courses),
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

        $teacherCounts = (clone $query)
            ->whereNotNull('primary_instructor_tenant_user_id')
            ->select('primary_instructor_tenant_user_id')
            ->selectRaw('COUNT(*) as courses_count')
            ->groupBy('primary_instructor_tenant_user_id')
            ->get();

        $teachersById = TenantUser::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('id', $teacherCounts->pluck('primary_instructor_tenant_user_id'))
            ->with('user')
            ->get()
            ->keyBy('id');

        $teachers = $teacherCounts
            ->map(function ($row) use ($teachersById) {
                $teacher = $teachersById->get($row->primary_instructor_tenant_user_id);
                $name = $teacher?->user?->name ?? $teacher?->name;

                return [
                    'id' => (string) $row->primary_instructor_tenant_user_id,
                    'name' => $name ?? 'مدرس',
                    'avatar' => $teacher?->avatar ?? $teacher?->user?->avatar,
                    'gender' => $teacher?->gender,
                    'specialization' => $teacher?->job_title ?? null,
                    'coursesCount' => (int) $row->courses_count,
                ];
            })
            ->values();

        $subjectCounts = (clone $query)
            ->whereNotNull('subject_id')
            ->select('subject_id')
            ->selectRaw('COUNT(*) as courses_count')
            ->groupBy('subject_id')
            ->get();

        $subjectsById = Subject::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('id', $subjectCounts->pluck('subject_id'))
            ->get()
            ->keyBy('id');

        $subjects = $subjectCounts
            ->map(function ($row) use ($subjectsById) {
                $subject = $subjectsById->get($row->subject_id);

                return [
                    'id' => (string) $row->subject_id,
                    'name' => $subject?->name ?? 'مادة',
                    'coursesCount' => (int) $row->courses_count,
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
                'instructors.membership.user',
                'tags',
                'categories',
                'modules.sections.lessons.files',
                'modules.sections.lessons.exam',
                'modules.sections.quizzes',
            ])
            ->withCount(['enrollments', 'sections', 'lessons'])
            ->firstOrFail();

        return response()->json([
            'data' => new PublicCourseResource($course),
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
            ->where('is_published', true)
            ->where(function ($q) {
                $q->whereNull('course_session_id')
                  ->orWhereHas('courseSession', fn ($sq) => $sq->where('status', '!=', 'draft'));
            })
            ->with([
                'courseSession',
                'sections' => fn ($q) => $q
                    ->where('is_published', true)
                    ->orderBy('sort_order')
                    ->with([
                        'lessons' => fn ($lq) => $lq
                            ->where('status', 'published')
                            ->orderBy('sort_order')
                            ->with('files', 'courseSession'),
                    ]),
            ])
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
            ->with(['primaryInstructor.user', 'instructors.membership.user', 'tags', 'categories'])
            ->withCount(['enrollments', 'sections', 'lessons'])
            ->limit(6)
            ->get();

        return response()->json([
            'data' => PublicCourseResource::collection($related),
        ]);
    }
}
