<?php

namespace App\Http\Controllers\Api\v1\Quizzes;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Quizzes\QuizService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class QuizQuestionController extends Controller
{
    public function store(Request $request, Quiz $quiz, QuizService $quizzes): JsonResponse
    {
        abort_if($quiz->tenant_id !== currentTenant()->id, 404);
        abort_unless($this->canManageQuiz(request()->user(), $quiz), 403);

        $question = $quizzes->createQuestion($quiz, $this->validateQuestion($request));

        return response()->json([
            'message' => 'Quiz question created.',
            'question' => $question,
        ], 201);
    }

    public function update(Request $request, Quiz $quiz, QuizQuestion $question, QuizService $quizzes): JsonResponse
    {
        abort_if($quiz->tenant_id !== currentTenant()->id, 404);
        abort_if($question->tenant_id !== currentTenant()->id || $question->quiz_id !== $quiz->id, 404);
        abort_unless($this->canManageQuiz(request()->user(), $quiz), 403);

        $question = $quizzes->updateQuestion($quiz, $question, $this->validateQuestion($request, true));

        return response()->json([
            'message' => 'Quiz question updated.',
            'question' => $question,
        ]);
    }

    public function destroy(Quiz $quiz, QuizQuestion $question, QuizService $quizzes): JsonResponse
    {
        abort_if($quiz->tenant_id !== currentTenant()->id, 404);
        abort_if($question->tenant_id !== currentTenant()->id || $question->quiz_id !== $quiz->id, 404);
        abort_unless($this->canManageQuiz(request()->user(), $quiz), 403);

        $quizzes->deleteQuestion($quiz, $question);

        return response()->json(['message' => 'Quiz question deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateQuestion(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'type' => [$partial ? 'sometimes' : 'required', Rule::in(['single_choice', 'multiple_choice', 'true_false'])],
            'question_text' => [$partial ? 'sometimes' : 'required', 'string'],
            'points' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'options' => [$partial ? 'sometimes' : 'required', 'array', 'min:2'],
            'options.*.option_text' => ['required_with:options', 'string'],
            'options.*.is_correct' => ['sometimes', 'boolean'],
            'options.*.sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);
    }

    private function canManageQuiz(User $user, Quiz $quiz): bool
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

        $course = $quiz->course;

        return $authorization->hasRole($user, $tenant, 'instructor')
            && $authorization->hasPermission($user, $tenant, 'courses.update')
            && (
                $course->created_by_tenant_user_id === $membership->id
                || $course->primary_instructor_tenant_user_id === $membership->id
                || $course->instructors()->where('tenant_user_id', $membership->id)->exists()
            );
    }
}
