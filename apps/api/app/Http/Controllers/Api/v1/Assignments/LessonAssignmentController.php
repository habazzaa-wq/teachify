<?php

namespace App\Http\Controllers\Api\v1\Assignments;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\User;
use App\Services\Access\AccessEvaluationService;
use App\Services\Assignments\AssignmentService;
use App\Services\Authorization\TenantAuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LessonAssignmentController extends Controller
{
    public function show(Course $course, CourseSection $section, CourseLesson $lesson, AccessEvaluationService $access): JsonResponse
    {
        $this->ensureLessonHierarchy($course, $section, $lesson);
        $assignment = $lesson->assignment()->firstOrFail();

        if (! $this->canManageAssignment(request()->user(), $course)) {
            abort_unless($assignment->status === 'published' && $access->canAccessLesson(request()->user(), $lesson), 404);
        }

        return response()->json(['assignment' => $assignment]);
    }

    public function store(
        Request $request,
        Course $course,
        CourseSection $section,
        CourseLesson $lesson,
        AssignmentService $assignments,
    ): JsonResponse {
        $this->ensureLessonHierarchy($course, $section, $lesson);
        abort_unless($this->canManageAssignment(request()->user(), $course), 403);

        $assignment = $assignments->create($course, $section, $lesson, $this->validateAssignment($request));

        return response()->json([
            'message' => 'Assignment created.',
            'assignment' => $assignment,
        ], 201);
    }

    public function update(
        Request $request,
        Course $course,
        CourseSection $section,
        CourseLesson $lesson,
        AssignmentService $assignments,
    ): JsonResponse {
        $this->ensureLessonHierarchy($course, $section, $lesson);
        abort_unless($this->canManageAssignment(request()->user(), $course), 403);

        $assignment = $assignments->update($lesson->assignment()->firstOrFail(), $this->validateAssignment($request, true));

        return response()->json([
            'message' => 'Assignment updated.',
            'assignment' => $assignment,
        ]);
    }

    public function updateStatus(
        Request $request,
        Course $course,
        CourseSection $section,
        CourseLesson $lesson,
        AssignmentService $assignments,
    ): JsonResponse {
        $this->ensureLessonHierarchy($course, $section, $lesson);
        abort_unless($this->canManageAssignment(request()->user(), $course), 403);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
        ]);

        $assignment = $assignments->changeStatus($lesson->assignment()->firstOrFail(), $validated['status']);

        return response()->json([
            'message' => 'Assignment status updated.',
            'assignment' => $assignment,
        ]);
    }

    public function destroy(Course $course, CourseSection $section, CourseLesson $lesson, AssignmentService $assignments): JsonResponse
    {
        $this->ensureLessonHierarchy($course, $section, $lesson);
        abort_unless($this->canManageAssignment(request()->user(), $course), 403);

        $assignments->delete($lesson->assignment()->firstOrFail());

        return response()->json(['message' => 'Assignment deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateAssignment(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'title' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'instructions' => ['nullable', 'string'],
            'max_score' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'due_at' => ['nullable', 'date'],
            'allow_late_submission' => ['sometimes', 'boolean'],
        ]);
    }

    private function ensureLessonHierarchy(Course $course, CourseSection $section, CourseLesson $lesson): void
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        abort_if($section->tenant_id !== $course->tenant_id || $section->course_id !== $course->id, 404);
        abort_if(
            $lesson->tenant_id !== $course->tenant_id
            || $lesson->course_id !== $course->id
            || $lesson->course_section_id !== $section->id,
            404,
        );
    }

    private function canManageAssignment(User $user, Course $course): bool
    {
        $authorization = app(TenantAuthorizationService::class);
        $tenant = currentTenant();

        if ($authorization->hasRole($user, $tenant, 'tenant_owner') || $authorization->hasRole($user, $tenant, 'admin')) {
            return $authorization->hasPermission($user, $tenant, 'courses.update');
        }

        $membership = $authorization->membershipFor($user, $tenant);

        if (! $membership || $membership->status !== 'active') {
            return false;
        }

        return $authorization->hasRole($user, $tenant, 'instructor')
            && $authorization->hasPermission($user, $tenant, 'courses.update')
            && (
                $course->created_by_tenant_user_id === $membership->id
                || $course->primary_instructor_tenant_user_id === $membership->id
                || $course->instructors()->where('tenant_user_id', $membership->id)->exists()
            );
    }
}
