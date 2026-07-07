<?php

namespace App\Http\Controllers\Api\v1\Courses;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseInstructor;
use App\Services\Courses\CourseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class CourseInstructorController extends Controller
{
    public function store(Request $request, Course $course, CourseService $courses): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('assignInstructors', $course);

        $validated = $request->validate([
            'tenant_user_id' => ['required', 'integer'],
            'role' => ['sometimes', Rule::in(['primary', 'co_instructor', 'assistant'])],
            'is_visible' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $assignment = $courses->attachInstructor(currentTenant(), $course, $validated);

        return response()->json([
            'message' => 'Course instructor assigned.',
            'instructor' => $assignment->load('membership.user'),
        ], 201);
    }

    public function destroy(Course $course, CourseInstructor $instructor, CourseService $courses): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        abort_if($instructor->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('assignInstructors', $course);

        $courses->detachInstructor($course, $instructor);

        return response()->json(['message' => 'Course instructor removed.']);
    }
}
