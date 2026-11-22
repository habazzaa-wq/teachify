<?php

namespace App\Http\Controllers\Api\v1\Sessions;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\v1\Sessions\BulkMarkAttendanceRequest;
use App\Http\Requests\Api\v1\Sessions\MarkAttendanceRequest;
use App\Http\Resources\SessionAttendanceResource;
use App\Models\Course;
use App\Models\CourseSession;
use App\Models\CourseSessionEnrollment;
use App\Models\SessionAttendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SessionAttendanceController extends Controller
{
    public function index(Request $request, Course $course, CourseSession $session): JsonResponse
    {
        $tenant = currentTenant();
        abort_if($course->tenant_id !== $tenant->id || $session->tenant_id !== $tenant->id || $session->course_id !== $course->id, 404);
        Gate::authorize('viewAny', [SessionAttendance::class, $session]);

        $query = SessionAttendance::query()
            ->where('tenant_id', $tenant->id)
            ->where('course_session_id', $session->id)
            ->with(['student.user', 'markedBy.user'])
            ->orderBy('id');

        $records = $query->paginate(min((int) $request->integer('per_page', 50), 100));

        return response()->json([
            'data' => SessionAttendanceResource::collection($records->items()),
            'meta' => [
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
            ],
        ]);
    }

    public function me(Course $course, CourseSession $session): JsonResponse
    {
        $tenant = currentTenant();
        abort_if($course->tenant_id !== $tenant->id || $session->tenant_id !== $tenant->id || $session->course_id !== $course->id, 404);
        Gate::authorize('view', $session);

        $membership = currentTenantUser();
        $attendance = SessionAttendance::query()
            ->where('tenant_id', $tenant->id)
            ->where('course_session_id', $session->id)
            ->where('tenant_user_id', $membership->id)
            ->with(['student.user', 'markedBy.user'])
            ->first();

        return response()->json(['data' => $attendance ? new SessionAttendanceResource($attendance) : null]);
    }

    public function mark(MarkAttendanceRequest $request, Course $course, CourseSession $session, int $tenantUserId): JsonResponse
    {
        $tenant = currentTenant();
        abort_if($course->tenant_id !== $tenant->id || $session->tenant_id !== $tenant->id || $session->course_id !== $course->id, 404);
        Gate::authorize('create', [SessionAttendance::class, $session]);

        $sessionEnrollment = CourseSessionEnrollment::query()
            ->where('tenant_id', $tenant->id)
            ->where('course_session_id', $session->id)
            ->where('tenant_user_id', $tenantUserId)
            ->firstOrFail();

        $attendance = SessionAttendance::query()->firstOrNew([
            'tenant_id' => $tenant->id,
            'course_session_id' => $session->id,
            'tenant_user_id' => $tenantUserId,
        ]);
        $attendance->course_session_enrollment_id = $sessionEnrollment->id;
        $attendance->status = $request->validated('status');
        $attendance->note = $request->validated('note');
        $attendance->marked_by_tenant_user_id = currentTenantUser()->id;
        $attendance->marked_at = now();
        $attendance->save();

        return response()->json([
            'message' => 'Attendance recorded.',
            'data' => new SessionAttendanceResource($attendance->load(['student.user', 'markedBy.user'])),
        ]);
    }

    public function bulkMark(BulkMarkAttendanceRequest $request, Course $course, CourseSession $session): JsonResponse
    {
        $tenant = currentTenant();
        abort_if($course->tenant_id !== $tenant->id || $session->tenant_id !== $tenant->id || $session->course_id !== $course->id, 404);
        Gate::authorize('create', [SessionAttendance::class, $session]);

        $marker = currentTenantUser();
        $results = [];
        foreach ($request->validated('attendances') as $row) {
            $tenantUserId = (int) $row['tenant_user_id'];
            $sessionEnrollment = CourseSessionEnrollment::query()
                ->where('tenant_id', $tenant->id)
                ->where('course_session_id', $session->id)
                ->where('tenant_user_id', $tenantUserId)
                ->first();
            if (! $sessionEnrollment) {
                continue;
            }
            $attendance = SessionAttendance::query()->firstOrNew([
                'tenant_id' => $tenant->id,
                'course_session_id' => $session->id,
                'tenant_user_id' => $tenantUserId,
            ]);
            $attendance->course_session_enrollment_id = $sessionEnrollment->id;
            $attendance->status = $row['status'];
            $attendance->note = $row['note'] ?? null;
            $attendance->marked_by_tenant_user_id = $marker->id;
            $attendance->marked_at = now();
            $attendance->save();
            $results[] = $attendance->load(['student.user', 'markedBy.user']);
        }

        return response()->json([
            'message' => 'Attendance updated.',
            'data' => SessionAttendanceResource::collection($results),
        ]);
    }
}
