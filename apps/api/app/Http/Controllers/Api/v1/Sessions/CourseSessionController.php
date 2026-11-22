<?php

namespace App\Http\Controllers\Api\v1\Sessions;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\v1\Sessions\StoreCourseSessionRequest;
use App\Http\Requests\Api\v1\Sessions\UpdateCourseSessionRequest;
use App\Http\Resources\CourseSessionResource;
use App\Http\Resources\SessionAttendanceResource;
use App\Models\Course;
use App\Models\CourseSession;
use App\Models\SessionAttendance;
use App\Services\Sessions\CourseSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CourseSessionController extends Controller
{
    public function __construct(private readonly CourseSessionService $service)
    {
    }

    public function index(Request $request, Course $course): JsonResponse
    {
        $tenant = currentTenant();
        abort_if($course->tenant_id !== $tenant->id, 404);
        Gate::authorize('viewAny', CourseSession::class);

        $auth = app(\App\Services\Authorization\TenantAuthorizationService::class);
        $user = $request->user();
        $membership = $auth->membershipFor($user, $tenant);
        $isOperator = $auth->hasRole($user, $tenant, 'tenant_owner') || $auth->hasRole($user, $tenant, 'admin');

        $query = CourseSession::query()
            ->where('tenant_id', $tenant->id)
            ->where('course_id', $course->id)
            ->with(['instructor.user'])
            ->withCount('sessionEnrollments')
            ->orderBy('starts_at_utc');

        if (! $isOperator) {
            $isAssignedInstructor = $membership && CourseSession::query()
                ->where('tenant_id', $tenant->id)
                ->where('course_id', $course->id)
                ->where('instructor_tenant_user_id', $membership->id)
                ->exists();
            if (! $isAssignedInstructor) {
                $isEnrolled = $membership && \App\Models\CourseEnrollment::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('course_id', $course->id)
                    ->where('tenant_user_id', $membership->id)
                    ->where('status', 'active')
                    ->exists();
                abort_unless($isEnrolled, 403);
                $query->where('status', '!=', CourseSession::STATUS_DRAFT);
            }
        }

        if ($request->boolean('upcoming')) {
            $query->where('starts_at_utc', '>=', now());
        }
        if ($request->boolean('past')) {
            $query->where('starts_at_utc', '<', now());
        }
        if ($request->filled('status')) {
            $status = $request->string('status')->toString();
            if (! $isOperator && $status === CourseSession::STATUS_DRAFT) {
                abort(403);
            }
            $query->where('status', $status);
        }

        $sessions = $query->paginate(min((int) $request->integer('per_page', 25), 100));

        return response()->json([
            'data' => CourseSessionResource::collection($sessions->items()),
            'meta' => [
                'current_page' => $sessions->currentPage(),
                'last_page' => $sessions->lastPage(),
                'per_page' => $sessions->perPage(),
                'total' => $sessions->total(),
            ],
        ]);
    }

    public function store(StoreCourseSessionRequest $request, Course $course): JsonResponse
    {
        $tenant = currentTenant();
        abort_if($course->tenant_id !== $tenant->id, 404);
        Gate::authorize('create', CourseSession::class);

        $session = $this->service->create($tenant, $course, currentTenantUser(), $request->validated());

        return response()->json([
            'message' => 'Session created.',
            'data' => new CourseSessionResource($session),
        ], 201);
    }

    public function show(Course $course, CourseSession $session): JsonResponse
    {
        $tenant = currentTenant();
        abort_if($course->tenant_id !== $tenant->id || $session->tenant_id !== $tenant->id || $session->course_id !== $course->id, 404);
        Gate::authorize('view', $session);

        $session->load(['instructor.user'])->loadCount('sessionEnrollments');

        return response()->json(['data' => new CourseSessionResource($session)]);
    }

    public function update(UpdateCourseSessionRequest $request, Course $course, CourseSession $session): JsonResponse
    {
        $tenant = currentTenant();
        abort_if($course->tenant_id !== $tenant->id || $session->tenant_id !== $tenant->id || $session->course_id !== $course->id, 404);
        Gate::authorize('update', $session);

        $session = $this->service->update($tenant, $session, $request->validated());

        return response()->json([
            'message' => 'Session updated.',
            'data' => new CourseSessionResource($session),
        ]);
    }

    public function destroy(Course $course, CourseSession $session): JsonResponse
    {
        $tenant = currentTenant();
        abort_if($course->tenant_id !== $tenant->id || $session->tenant_id !== $tenant->id || $session->course_id !== $course->id, 404);
        Gate::authorize('delete', $session);

        $session->delete();

        return response()->json(['message' => 'Session deleted.']);
    }

    public function schedule(Course $course, CourseSession $session): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id || $session->tenant_id !== currentTenant()->id || $session->course_id !== $course->id, 404);
        Gate::authorize('update', $session);
        $session = $this->service->schedule(currentTenant(), $session);
        return response()->json(['message' => 'Session scheduled.', 'data' => new CourseSessionResource($session)]);
    }

    public function cancel(Request $request, Course $course, CourseSession $session): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id || $session->tenant_id !== currentTenant()->id || $session->course_id !== $course->id, 404);
        Gate::authorize('update', $session);
        $validated = $request->validate(['cancellation_reason' => ['nullable', 'string', 'max:1000']]);
        $session = $this->service->cancel(currentTenant(), $session, $validated['cancellation_reason'] ?? null);
        return response()->json(['message' => 'Session cancelled.', 'data' => new CourseSessionResource($session)]);
    }

    public function complete(Course $course, CourseSession $session): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id || $session->tenant_id !== currentTenant()->id || $session->course_id !== $course->id, 404);
        Gate::authorize('update', $session);
        $session = $this->service->complete(currentTenant(), $session);
        return response()->json(['message' => 'Session completed.', 'data' => new CourseSessionResource($session)]);
    }

    public function enrollments(Request $request, Course $course, CourseSession $session): JsonResponse
    {
        $tenant = currentTenant();
        abort_if($course->tenant_id !== $tenant->id || $session->tenant_id !== $tenant->id || $session->course_id !== $course->id, 404);
        Gate::authorize('viewAny', [\App\Models\SessionAttendance::class, $session]);

        $records = $session->sessionEnrollments()
            ->where('tenant_id', $tenant->id)
            ->with(['tenantUser.user', 'attendance'])
            ->paginate(min((int) $request->integer('per_page', 50), 100));

        return response()->json([
            'data' => $records->items() ? collect($records->items())->map(fn ($e) => [
                'id' => (string) $e->id,
                'tenantUserId' => (string) $e->tenant_user_id,
                'status' => $e->status,
                'student' => $e->tenantUser ? [
                    'id' => (string) $e->tenantUser->id,
                    'name' => $e->tenantUser->user?->name,
                    'email' => $e->tenantUser->user?->email,
                ] : null,
                'attendance' => $e->attendance ? new SessionAttendanceResource($e->attendance->loadMissing(['markedBy.user'])) : null,
            ])->values() : [],
            'meta' => [
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
            ],
        ]);
    }

    public function statistics(Course $course, CourseSession $session): JsonResponse
    {
        $tenant = currentTenant();
        abort_if($course->tenant_id !== $tenant->id || $session->tenant_id !== $tenant->id || $session->course_id !== $course->id, 404);
        Gate::authorize('viewAny', [\App\Models\SessionAttendance::class, $session]);

        $counts = SessionAttendance::query()
            ->where('tenant_id', $tenant->id)
            ->where('course_session_id', $session->id)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'data' => [
                'total' => (int) $counts->sum(),
                'pending' => (int) ($counts['pending'] ?? 0),
                'present' => (int) ($counts['present'] ?? 0),
                'absent' => (int) ($counts['absent'] ?? 0),
                'late' => (int) ($counts['late'] ?? 0),
                'excused' => (int) ($counts['excused'] ?? 0),
            ],
        ]);
    }
}
