<?php

namespace App\Http\Controllers\Api\v1\Quizzes;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\TenantUser;
use App\Services\Access\AccessEvaluationService;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Quizzes\QuizAttemptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizAttemptController extends Controller
{
    public function start(Quiz $quiz, QuizAttemptService $attempts, AccessEvaluationService $access): JsonResponse
    {
        abort_if($quiz->tenant_id !== currentTenant()->id, 404);
        $this->authorizeStudentQuizAccess($quiz, $access);

        $attempt = $attempts->startAttempt($quiz, app(TenantUser::class));

        return response()->json([
            'message' => 'Quiz attempt started.',
            'attempt' => $this->serializeAttempt($attempt),
        ], 201);
    }

    public function submit(
        Request $request,
        Quiz $quiz,
        QuizAttempt $attempt,
        QuizAttemptService $attempts,
        AccessEvaluationService $access,
    ): JsonResponse {
        abort_if($quiz->tenant_id !== currentTenant()->id, 404);
        abort_if($attempt->tenant_id !== currentTenant()->id || $attempt->quiz_id !== $quiz->id, 404);
        $this->authorizeStudentQuizAccess($quiz, $access);

        $validated = $request->validate([
            'answers' => ['required', 'array', 'min:1'],
            'answers.*.quiz_question_id' => ['required', 'integer'],
            'answers.*.selected_option_ids' => ['required', 'array', 'min:1'],
            'answers.*.selected_option_ids.*' => ['integer'],
        ]);

        $attempt = $attempts->submitAttempt($quiz, $attempt, app(TenantUser::class), $validated['answers']);

        return response()->json([
            'message' => 'Quiz attempt submitted.',
            'attempt' => $attempt,
        ]);
    }

    private function authorizeStudentQuizAccess(Quiz $quiz, AccessEvaluationService $access): void
    {
        $user = request()->user();
        $authorization = app(TenantAuthorizationService::class);

        abort_unless(
            $authorization->hasRole($user, currentTenant(), 'student')
            && $quiz->status === 'published'
            && $access->canAccessLesson($user, $quiz->lesson),
            403,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeAttempt(QuizAttempt $attempt): array
    {
        $data = $attempt->toArray();

        $data['quiz']['questions'] = collect($data['quiz']['questions'] ?? [])
            ->map(function (array $question): array {
                $question['options'] = collect($question['options'] ?? [])
                    ->map(function (array $option): array {
                        unset($option['is_correct']);

                        return $option;
                    })
                    ->all();

                return $question;
            })
            ->all();

        return $data;
    }
}
