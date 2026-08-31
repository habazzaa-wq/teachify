<?php

namespace App\Http\Controllers\Api\v1\Courses;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use App\Repositories\CourseRepository;
use App\Repositories\CourseSectionRepository;
use App\Services\Courses\CourseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CourseController extends Controller
{
    public function __construct(
        private readonly CourseRepository $repository,
        private readonly CourseService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Course::class);

        $courses = $this->repository->list($request->all());

        return response()->json([
            'data' => CourseResource::collection($courses),
            'total' => $courses->total(),
            'per_page' => $courses->perPage(),
            'current_page' => $courses->currentPage(),
            'last_page' => $courses->lastPage(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Course::class);

        $validated = $this->validateCourse($request);
        $course = $this->service->create(currentTenant(), currentTenantUser(), $validated);

        return response()->json([
            'message' => 'Course created successfully.',
            'data' => new CourseResource($course),
        ], 201);
    }

    public function show(Course $course): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('view', $course);

        return response()->json([
            'data' => new CourseResource($course->loadMissing(['creator.user', 'instructors.membership.user', 'tags', 'settings'])->loadCount(['enrollments', 'sections', 'lessons'])),
        ]);
    }

    public function update(Request $request, Course $course): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $course);

        $validated = $this->validateCourse($request, true);
        $course = $this->service->update(currentTenant(), $course, $validated);

        return response()->json([
            'message' => 'Course updated successfully.',
            'data' => new CourseResource($course),
        ]);
    }

    public function destroy(Course $course): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('delete', $course);

        $this->repository->delete($course);

        return response()->json(['message' => 'Course deleted successfully.']);
    }

    public function updateStatus(Request $request, Course $course): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['draft', 'review', 'published', 'archived'])],
        ]);

        if ($validated['status'] === 'published') {
            Gate::authorize('publish', $course);
        } elseif ($validated['status'] === 'archived') {
            Gate::authorize('archive', $course);
        } else {
            Gate::authorize('update', $course);
        }

        $course = $this->service->changeStatus($course, $validated['status']);

        return response()->json([
            'message' => 'Course status updated.',
            'data' => new CourseResource($course),
        ]);
    }

    public function publish(Course $course): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('publish', $course);

        $course = $this->service->publish($course);

        return response()->json([
            'message' => 'Course published successfully.',
            'data' => new CourseResource($course),
        ]);
    }

    public function archive(Course $course): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('archive', $course);

        $course = $this->service->archive($course);

        return response()->json([
            'message' => 'Course archived successfully.',
            'data' => new CourseResource($course),
        ]);
    }

    public function restore(Course $course): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $course);

        $course = $this->service->restore($course);

        return response()->json([
            'message' => 'Course restored successfully.',
            'data' => new CourseResource($course),
        ]);
    }

    public function duplicate(Course $course): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('create', Course::class);

        $newCourse = $this->service->duplicate($course, currentTenantUser());

        return response()->json([
            'message' => 'Course duplicated successfully.',
            'data' => new CourseResource($newCourse),
        ], 201);
    }

    public function feature(Course $course): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('feature', $course);

        $course = $this->service->toggleFeatured($course);

        return response()->json([
            'message' => $course->featured ? 'Course featured.' : 'Course unfeatured.',
            'data' => new CourseResource($course),
        ]);
    }

    /**
     * @return array<int, int>
     */
    private function validatedBulkIds(Request $request): array
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['integer', 'distinct'],
        ]);

        return array_map('intval', array_values($validated['ids']));
    }

    public function bulkPublish(Request $request): JsonResponse
    {
        $count = 0;
        foreach ($this->repository->findByIds($this->validatedBulkIds($request)) as $course) {
            if (Gate::allows('publish', $course)) {
                $this->service->publish($course);
                $count++;
            }
        }

        return response()->json(['message' => "{$count} course(s) published."]);
    }

    public function bulkArchive(Request $request): JsonResponse
    {
        $count = 0;
        foreach ($this->repository->findByIds($this->validatedBulkIds($request)) as $course) {
            if (Gate::allows('archive', $course)) {
                $this->service->archive($course);
                $count++;
            }
        }

        return response()->json(['message' => "{$count} course(s) archived."]);
    }

    public function bulkRestore(Request $request): JsonResponse
    {
        $count = 0;
        foreach ($this->validatedBulkIds($request) as $id) {
            if ($this->repository->restore($id)) {
                $count++;
            }
        }

        return response()->json(['message' => "{$count} course(s) restored."]);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $count = 0;
        foreach ($this->repository->findByIds($this->validatedBulkIds($request)) as $course) {
            if (Gate::allows('delete', $course)) {
                $this->repository->delete($course);
                $count++;
            }
        }

        return response()->json(['message' => "{$count} course(s) deleted."]);
    }

    public function bulkFeature(Request $request): JsonResponse
    {
        $count = 0;
        foreach ($this->repository->findByIds($this->validatedBulkIds($request)) as $course) {
            if (Gate::allows('feature', $course)) {
                $this->service->toggleFeatured($course);
                $count++;
            }
        }

        return response()->json(['message' => "{$count} course(s) toggled as featured."]);
    }

    public function metrics(): JsonResponse
    {
        Gate::authorize('viewAny', Course::class);

        return response()->json([
            'data' => [
                'totalCourses' => $this->repository->countByStatus('draft')
                    + $this->repository->countByStatus('review')
                    + $this->repository->countByStatus('published')
                    + $this->repository->countByStatus('archived'),
                'published' => $this->repository->countByStatus('published'),
                'draft' => $this->repository->countByStatus('draft'),
                'archived' => $this->repository->countByStatus('archived'),
                'revenue' => $this->repository->sumRevenue(),
                'enrollments' => $this->repository->countEnrollmentsTotal(),
                'avgRating' => $this->repository->avgRating(),
                'completionRate' => $this->repository->completionRate(),
                'featured' => $this->repository->countFeatured(),
                'totalSections' => (new CourseSectionRepository)->countTotal(),
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        Gate::authorize('viewAny', Course::class);

        $courses = $this->repository->listAll($request->all());

        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="courses_'.now()->format('Y-m-d').'.csv"',
        ];

        $callback = function () use ($courses): void {
            $handle = fopen('php://output', 'wb');
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Title', 'Slug', 'Status', 'Visibility', 'Difficulty',
                'Language', 'Duration', 'Price', 'Currency',
                'Instructor', 'Category', 'Students', 'Featured',
                'Published At', 'Created At',
            ]);

            foreach ($courses as $course) {
                fputcsv($handle, [
                    $course->title,
                    $course->slug,
                    $course->status,
                    $course->visibility,
                    $course->difficulty,
                    $course->language,
                    $course->duration,
                    $course->price_amount,
                    $course->price_currency,
                    $course->primaryInstructor?->user?->name,
                    $course->categories->first()?->name,
                    $course->enrollments_count,
                    $course->featured ? 'Yes' : 'No',
                    $course->published_at?->toIso8601String(),
                    $course->created_at->toIso8601String(),
                ]);
            }

            fclose($handle);
        };

        return new StreamedResponse($callback, 200, $headers);
    }

    private function validateCourse(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$required, 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'alpha_dash:ascii'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'full_description' => ['nullable', 'string'],
            'thumbnail_path' => ['nullable', 'string', 'max:2048'],
            'cover_image_path' => ['nullable', 'string', 'max:2048'],
            'primary_instructor_tenant_user_id' => ['sometimes', 'integer'],
            'visibility' => ['sometimes', Rule::in(['private', 'public', 'unlisted'])],
            'difficulty' => ['sometimes', Rule::in(['beginner', 'intermediate', 'advanced', 'all_levels'])],
            'language' => ['sometimes', 'string', 'max:10'],
            'duration' => ['nullable', 'integer', 'min:0'],
            'pricing_type' => ['sometimes', Rule::in(['free', 'one_time', 'subscription'])],
            'price_amount' => ['nullable', 'integer', 'min:0'],
            'price_currency' => ['nullable', 'string', 'size:3'],
            'discount_price' => ['nullable', 'integer', 'min:0'],
            'enrollment_limit' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'certificate_enabled' => ['sometimes', 'boolean'],
            'featured' => ['sometimes', 'boolean'],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:500'],
            'seo_keywords' => ['nullable', 'string', 'max:500'],
            'requirements' => ['nullable', 'array'],
            'requirements.*' => ['string', 'max:500'],
            'learning_outcomes' => ['nullable', 'array'],
            'learning_outcomes.*' => ['string', 'max:500'],
            'target_audience' => ['nullable', 'array'],
            'target_audience.*' => ['string', 'max:500'],
            'educational_stage_id' => ['nullable', 'integer', 'exists:educational_stages,id'],
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'category_ids' => ['sometimes', 'array'],
            'category_ids.*' => ['integer'],
            'tag_ids' => ['sometimes', 'array'],
            'tag_ids.*' => ['integer'],
        ]);
    }
}
