<?php

namespace App\Http\Controllers\Api\v1\Quizzes;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\Quiz;
use App\Models\User;
use App\Services\Access\AccessEvaluationService;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Quizzes\QuizService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LessonQuizController extends Controller
{
    public function show(
        Course $course,
        CourseSection $section,
        CourseLesson $lesson,
        AccessEvaluationService $access,
    ): JsonResponse {
        $this->ensureLessonHierarchy($course, $section, $lesson);
        $quiz = $lesson->quiz()->with('questions.options')->firstOrFail();

        if (! $this->canManageQuiz(request()->user(), $course)) {
            abort_unless($quiz->status === 'published' && $access->canAccessLesson(request()->user(), $lesson), 404);
        }

        return response()->json([
            'quiz' => $this->serializeQuiz($quiz, $this->canManageQuiz(request()->user(), $course)),
        ]);
    }

    public function store(
        Request $request,
        Course $course,
        CourseSection $section,
        CourseLesson $lesson,
        QuizService $quizzes,
    ): JsonResponse {
        $this->ensureLessonHierarchy($course, $section, $lesson);
        abort_unless($this->canManageQuiz(request()->user(), $course), 403);

        $quiz = $quizzes->create($course, $section, $lesson, $this->validateQuiz($request));

        return response()->json([
            'message' => 'Quiz created.',
            'quiz' => $quiz,
        ], 201);
    }

    public function update(
        Request $request,
        Course $course,
        CourseSection $section,
        CourseLesson $lesson,
        QuizService $quizzes,
    ): JsonResponse {
        $this->ensureLessonHierarchy($course, $section, $lesson);
        abort_unless($this->canManageQuiz(request()->user(), $course), 403);

        $quiz = $lesson->quiz()->firstOrFail();
        $quiz = $quizzes->update($quiz, $this->validateQuiz($request, true));

        return response()->json([
            'message' => 'Quiz updated.',
            'quiz' => $quiz,
        ]);
    }

    public function updateStatus(
        Request $request,
        Course $course,
        CourseSection $section,
        CourseLesson $lesson,
        QuizService $quizzes,
    ): JsonResponse {
        $this->ensureLessonHierarchy($course, $section, $lesson);
        abort_unless($this->canManageQuiz(request()->user(), $course), 403);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
        ]);

        $quiz = $quizzes->changeStatus($lesson->quiz()->firstOrFail(), $validated['status']);

        return response()->json([
            'message' => 'Quiz status updated.',
            'quiz' => $quiz,
        ]);
    }

    public function destroy(Course $course, CourseSection $section, CourseLesson $lesson, QuizService $quizzes): JsonResponse
    {
        $this->ensureLessonHierarchy($course, $section, $lesson);
        abort_unless($this->canManageQuiz(request()->user(), $course), 403);

        $quizzes->delete($lesson->quiz()->firstOrFail());

        return response()->json(['message' => 'Quiz deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateQuiz(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'title' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'passing_score' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'max_attempts' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:1', 'max:1440'],
            'shuffle_questions' => ['sometimes', 'boolean'],
            'shuffle_answers' => ['sometimes', 'boolean'],
            'show_correct_answers' => ['sometimes', 'boolean'],
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

    private function canManageQuiz(User $user, Course $course): bool
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

    /**
     * @return array<string, mixed>
     */
    private function serializeQuiz(Quiz $quiz, bool $includeCorrectAnswers): array
    {
        $data = $quiz->toArray();

        if (! $includeCorrectAnswers && ! $quiz->show_correct_answers) {
            $data['questions'] = collect($data['questions'] ?? [])
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
        }

        return $data;
    }
}
