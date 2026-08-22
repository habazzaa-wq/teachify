<?php

namespace App\Http\Controllers\Api\v1\ExamBank;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExamBank\SaveExamAnswerRequest;
use App\Http\Requests\ExamBank\SaveExamProgressRequest;
use App\Http\Resources\ExamSessionResource;
use App\Models\CourseLesson;
use App\Models\ExamAttempt;
use App\Models\ExamQuestion;
use App\Services\ExamBank\ExamSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class ExamSessionController extends Controller
{
    public function start(CourseLesson $lesson, ExamSessionService $service): JsonResponse
    {
        abort_if($lesson->tenant_id !== currentTenant()->id, 404);

        $attempt = $service->start(request()->user(), $lesson);
        $session = $service->session($attempt, request()->user());

        return response()->json([
            'message' => 'Exam attempt started.',
            'data' => new ExamSessionResource($session),
        ], 201);
    }

    public function current(CourseLesson $lesson, ExamSessionService $service): JsonResponse
    {
        abort_if($lesson->tenant_id !== currentTenant()->id, 404);

        $exam = $lesson->exam;

        if ($exam === null) {
            return response()->json(['data' => null]);
        }

        $attempt = $service->current(request()->user(), $exam);

        if ($attempt === null) {
            return response()->json(['data' => null]);
        }

        $session = $service->session($attempt, request()->user());

        return response()->json([
            'data' => new ExamSessionResource($session),
        ]);
    }

    public function show(ExamAttempt $attempt, ExamSessionService $service): JsonResponse
    {
        abort_unless(Gate::allows('view', $attempt), 404);

        $session = $service->session($attempt, request()->user());

        return response()->json([
            'data' => new ExamSessionResource($session),
        ]);
    }

    public function saveAnswer(
        SaveExamAnswerRequest $request,
        ExamAttempt $attempt,
        ExamQuestion $examQuestion,
        ExamSessionService $service,
    ): JsonResponse {
        abort_unless(Gate::allows('update', $attempt), 404);

        $saved = $service->saveAnswer(request()->user(), $attempt, $examQuestion, $request->validated('answer'));

        return response()->json([
            'message' => 'Answer saved.',
            'data' => [
                'status' => $saved->attempt->status,
            ],
        ]);
    }

    public function saveProgress(
        SaveExamProgressRequest $request,
        ExamAttempt $attempt,
        ExamSessionService $service,
    ): JsonResponse {
        abort_unless(Gate::allows('update', $attempt), 404);

        $attempt = $service->saveProgress(request()->user(), $attempt, $request->validated());

        return response()->json([
            'message' => 'Progress saved.',
            'data' => [
                'status' => $attempt->status,
            ],
        ]);
    }

    public function submit(ExamAttempt $attempt, ExamSessionService $service): JsonResponse
    {
        abort_unless(Gate::allows('submit', $attempt), 404);

        $attempt = $service->submit(request()->user(), $attempt);
        $session = $service->session($attempt, request()->user());

        return response()->json([
            'message' => 'Exam attempt submitted.',
            'data' => new ExamSessionResource($session),
        ]);
    }
}
