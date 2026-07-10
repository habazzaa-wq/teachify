<?php

namespace App\Http\Controllers\Api\v1\ExamBank;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Question;
use App\Repositories\ExamRepository;
use App\Repositories\QuestionRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ExamAnalyticsController extends Controller
{
    public function __construct(
        private readonly ExamRepository $examRepository,
        private readonly QuestionRepository $questionRepository,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Exam::class);

        $tenantId = currentTenant()->id;

        $attempts = ExamAttempt::query()->where('tenant_id', $tenantId);
        $submitted = (clone $attempts)->where('status', 'submitted')->count();
        $passed = (clone $attempts)->where('passed', true)->count();
        $totalAttempts = (clone $attempts)->count();

        $avgScore = (clone $attempts)
            ->where('status', 'submitted')
            ->where('max_score', '>', 0)
            ->average('score');

        $avgPassing = (clone $attempts)
            ->where('status', 'submitted')
            ->where('max_score', '>', 0)
            ->selectRaw('AVG(score / max_score * 100) as p')
            ->value('p');

        return response()->json([
            'data' => [
                'exams' => $this->examRepository->metricTotals(),
                'attempts' => [
                    'total' => $totalAttempts,
                    'submitted' => $submitted,
                    'inProgress' => $totalAttempts - $submitted,
                    'passed' => $passed,
                    'completionRate' => $submitted > 0
                        ? round(($submitted / $totalAttempts) * 100, 1)
                        : 0,
                    'passRate' => $submitted > 0
                        ? round(($passed / $submitted) * 100, 1)
                        : 0,
                    'averageScore' => $avgScore ? round((float) $avgScore, 2) : 0,
                    'averageScorePercent' => $avgPassing ? round((float) $avgPassing, 1) : 0,
                ],
                'questions' => [
                    'total' => Question::query()->where('tenant_id', $tenantId)->whereNull('deleted_at')->count(),
                    'byType' => $this->questionRepository->countByType(),
                ],
            ],
        ]);
    }

    public function exam(Request $request, Exam $exam): JsonResponse
    {
        abort_if($exam->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('view', $exam);

        $attempts = ExamAttempt::query()->where('tenant_id', $exam->tenant_id)->where('exam_id', $exam->id);
        $submitted = (clone $attempts)->where('status', 'submitted')->count();
        $passed = (clone $attempts)->where('passed', true)->count();

        $avgScore = (clone $attempts)
            ->where('status', 'submitted')
            ->where('max_score', '>', 0)
            ->average('score');

        return response()->json([
            'data' => [
                'examId' => (string) $exam->id,
                'title' => $exam->title,
                'attempts' => $attempts->count(),
                'submitted' => $submitted,
                'passed' => $passed,
                'passRate' => $submitted > 0 ? round(($passed / $submitted) * 100, 1) : 0,
                'averageScore' => $avgScore ? round((float) $avgScore, 2) : 0,
                'questionCount' => $exam->question_count,
                'totalPoints' => $exam->total_points,
            ],
        ]);
    }
}
