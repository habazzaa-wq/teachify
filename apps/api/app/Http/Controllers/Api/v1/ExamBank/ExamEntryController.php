<?php

namespace App\Http\Controllers\Api\v1\ExamBank;

use App\Http\Controllers\Controller;
use App\Models\CourseLesson;
use App\Services\ExamBank\ExamEntryService;
use Illuminate\Http\JsonResponse;

class ExamEntryController extends Controller
{
    public function show(CourseLesson $lesson, ExamEntryService $service): JsonResponse
    {
        abort_if($lesson->tenant_id !== currentTenant()->id, 404);

        return response()->json([
            'data' => $service->entry(request()->user(), $lesson),
        ]);
    }
}
