<?php

namespace App\Http\Controllers\Api\v1\Learning;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Learning\EnrollmentService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EnrollmentController extends Controller
{
    public function index(): JsonResponse
    {
        abort_unless($this->auth()->hasPermission(request()->user(), currentTenant(), 'enrollments.view'), 403);

        $query = CourseEnrollment::query()->with(['course', 'student.user']);
        $this->applyVisibility($query, request()->user());

        return response()->json($query->latest()->paginate(25));
    }

    public function store(Request $request, Course $course, EnrollmentService $enrollments): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canManage(request()->user()), 403);

        $validated = $request->validate([
            'tenant_user_id' => ['required', 'integer'],
            'status' => ['sometimes', Rule::in(['pending', 'active', 'completed', 'cancelled', 'suspended'])],
            'metadata' => ['sometimes', 'array'],
        ]);

        $student = TenantUser::query()
            ->where('tenant_id', currentTenant()->id)
            ->whereKey($validated['tenant_user_id'])
            ->where('status', 'active')
            ->firstOrFail();

        $enrollment = $enrollments->enrollStudent(
            currentTenant(),
            $course,
            $student,
            $validated['status'] ?? 'active',
            $validated['metadata'] ?? [],
        );

        return response()->json([
            'message' => 'Student enrolled.',
            'enrollment' => $enrollment,
        ], 201);
    }

    public function show(CourseEnrollment $enrollment): JsonResponse
    {
        abort_if($enrollment->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canView(request()->user(), $enrollment), 403);

        return response()->json([
            'enrollment' => $enrollment->load(['course', 'student.user', 'completion']),
        ]);
    }

    public function updateStatus(
        Request $request,
        CourseEnrollment $enrollment,
        EnrollmentService $enrollments,
    ): JsonResponse {
        abort_if($enrollment->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canManage(request()->user()), 403);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'completed', 'cancelled', 'suspended'])],
        ]);

        $enrollment = match ($validated['status']) {
            'active' => $enrollments->activate($enrollment),
            'completed' => $enrollments->complete($enrollment),
            'cancelled' => $enrollments->cancel($enrollment),
            'suspended' => $enrollments->suspend($enrollment),
        };

        return response()->json([
            'message' => 'Enrollment status updated.',
            'enrollment' => $enrollment,
        ]);
    }

    /**
     * @param Builder<CourseEnrollment> $query
     */
    private function applyVisibility(Builder $query, User $user): void
    {
        $tenant = currentTenant();
        $membership = app(TenantUser::class);

        if ($this->isOperator($user, $tenant)) {
            return;
        }

        $query->where(function (Builder $query) use ($user, $tenant, $membership): void {
            $query->where('tenant_user_id', $membership->id);

            if ($this->auth()->hasRole($user, $tenant, 'instructor')) {
                $query->orWhereHas('course', function (Builder $query) use ($membership): void {
                    $this->assignedCourseQuery($query, $membership);
                });
            }
        });
    }

    private function canView(User $user, CourseEnrollment $enrollment): bool
    {
        if ($enrollment->tenant_id !== currentTenant()->id) {
            return false;
        }

        $tenant = currentTenant();
        $membership = app(TenantUser::class);

        if ($enrollment->tenant_user_id === $membership->id) {
            return $this->auth()->hasPermission($user, $tenant, 'enrollments.view');
        }

        if ($this->isOperator($user, $tenant)) {
            return true;
        }

        return $this->auth()->hasRole($user, $tenant, 'instructor')
            && $this->auth()->hasPermission($user, $tenant, 'enrollments.view')
            && $this->isAssignedInstructor($membership, $enrollment->course);
    }

    private function canManage(User $user): bool
    {
        return $this->isOperator($user, currentTenant())
            && $this->auth()->hasPermission($user, currentTenant(), 'enrollments.manage');
    }

    private function isOperator(User $user, Tenant $tenant): bool
    {
        return $this->auth()->hasRole($user, $tenant, 'tenant_owner')
            || $this->auth()->hasRole($user, $tenant, 'admin');
    }

    private function isAssignedInstructor(TenantUser $membership, Course $course): bool
    {
        return $course->created_by_tenant_user_id === $membership->id
            || $course->primary_instructor_tenant_user_id === $membership->id
            || $course->instructors()->where('tenant_user_id', $membership->id)->exists();
    }

    /**
     * @param Builder<Course> $query
     */
    private function assignedCourseQuery(Builder $query, TenantUser $membership): void
    {
        $query
            ->where('created_by_tenant_user_id', $membership->id)
            ->orWhere('primary_instructor_tenant_user_id', $membership->id)
            ->orWhereHas('instructors', function (Builder $query) use ($membership): void {
                $query->where('tenant_user_id', $membership->id);
            });
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
