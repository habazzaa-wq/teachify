<?php

namespace App\Services\Quizzes;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\TenantUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuizAttemptService
{
    public function __construct(private readonly QuizGradingService $grading)
    {
    }

    public function startAttempt(Quiz $quiz, TenantUser $student): QuizAttempt
    {
        $this->ensureStudentCanAttempt($quiz, $student);

        $inProgress = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('tenant_user_id', $student->id)
            ->where('status', 'in_progress')
            ->first();

        if ($inProgress) {
            return $inProgress->load('quiz.questions.options');
        }

        $attemptCount = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('tenant_user_id', $student->id)
            ->count();

        if ($attemptCount >= $quiz->max_attempts) {
            throw ValidationException::withMessages([
                'attempt' => ['The maximum number of quiz attempts has been reached.'],
            ]);
        }

        return QuizAttempt::create([
            'tenant_id' => $quiz->tenant_id,
            'quiz_id' => $quiz->id,
            'tenant_user_id' => $student->id,
            'started_at' => now(),
            'status' => 'in_progress',
            'score' => null,
        ])->refresh()->load('quiz.questions.options');
    }

    /**
     * @param list<array{quiz_question_id:int,selected_option_ids:list<int>}> $answers
     */
    public function submitAttempt(Quiz $quiz, QuizAttempt $attempt, TenantUser $student, array $answers): QuizAttempt
    {
        $this->ensureAttemptBelongsToStudent($quiz, $attempt, $student);

        if ($attempt->status !== 'in_progress') {
            throw ValidationException::withMessages([
                'attempt' => ['Only in-progress attempts can be submitted.'],
            ]);
        }

        return DB::transaction(fn (): QuizAttempt => $this->grading->grade($quiz, $attempt, $answers));
    }

    private function ensureStudentCanAttempt(Quiz $quiz, TenantUser $student): void
    {
        if ($quiz->tenant_id !== currentTenant()->id || $student->tenant_id !== currentTenant()->id) {
            throw ValidationException::withMessages([
                'quiz' => ['The selected quiz is invalid for this tenant.'],
            ]);
        }

        if ($quiz->status !== 'published') {
            throw ValidationException::withMessages([
                'quiz' => ['The selected quiz is not available.'],
            ]);
        }
    }

    private function ensureAttemptBelongsToStudent(Quiz $quiz, QuizAttempt $attempt, TenantUser $student): void
    {
        if (
            $attempt->tenant_id !== currentTenant()->id
            || $attempt->quiz_id !== $quiz->id
            || $attempt->tenant_user_id !== $student->id
        ) {
            throw ValidationException::withMessages([
                'attempt' => ['The selected attempt is invalid for this quiz.'],
            ]);
        }
    }
}
