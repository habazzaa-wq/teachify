<?php

namespace App\Http\Controllers\Api\v1\Courses;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Services\Courses\CourseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CourseSettingController extends Controller
{
    public function index(Course $course): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('view', $course);

        return response()->json([
            'settings' => $course->settings()->orderBy('group')->get(),
        ]);
    }

    public function update(Request $request, Course $course, string $group, CourseService $courses): JsonResponse
    {
        abort_if($course->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('manageSettings', $course);

        $validated = $request->validate([
            'values' => ['required', 'array'],
        ]);

        $setting = $courses->updateSetting($course, $group, $validated['values']);

        return response()->json([
            'message' => 'Course setting updated.',
            'setting' => $setting,
        ]);
    }
}
