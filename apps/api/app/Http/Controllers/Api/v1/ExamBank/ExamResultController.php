<?php

namespace App\Http\Controllers\Api\v1\ExamBank;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExamSessionResource;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Services\ExamBank\ExamResultService;
use App\Services\ExamBank\ExamSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

/**
 * Phase 3 — Results & Review. Read-only result/review for a submitted attempt,
 * the student's attempt history for an exam, and starting a practice attempt
 * from the questions answered incorrectly on a submitted attempt.
 */
class ExamResultController extends Controller
{
    public function show(ExamAttempt $attempt, ExamResultService $service): JsonResponse
    {
        abort_unless(Gate::allows('view', $attempt), 404);

        $result = $service->result(request()->user(), $attempt);

        return response()->json([
            'data' => $result,
        ]);
    }

    public function history(Exam $exam, ExamResultService $service): JsonResponse
    {
        $history = $service->history(request()->user(), $exam);

        return response()->json([
            'data' => $history,
        ]);
    }

    public function practice(ExamAttempt $attempt, ExamSessionService $service): JsonResponse
    {
        abort_unless(Gate::allows('view', $attempt), 404);

        $practice = $service->startPractice(request()->user(), $attempt);
        $session = $service->session($practice, request()->user());

        return response()->json([
            'message' => 'Practice attempt started.',
            'data' => new ExamSessionResource($session),
        ], 201);
    }
}
