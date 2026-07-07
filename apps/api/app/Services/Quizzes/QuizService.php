<?php

namespace App\Services\Quizzes;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizQuestionOption;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuizService
{
    /**
     * @param array<string, mixed> $data
     */
    public function create(Course $course, CourseSection $section, CourseLesson $lesson, array $data): Quiz
    {
        $this->ensureLessonHierarchy($course, $section, $lesson);

        if ($lesson->quiz()->exists()) {
            throw ValidationException::withMessages([
                'quiz' => ['This lesson already has a quiz.'],
            ]);
        }

        return Quiz::create($this->quizPayload($lesson, $data, 'draft'))
            ->refresh()
            ->load('questions.options');
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(Quiz $quiz, array $data): Quiz
    {
        $quiz->fill(collect($data)->only([
            'title',
            'description',
            'passing_score',
            'max_attempts',
            'time_limit_minutes',
            'shuffle_questions',
            'shuffle_answers',
            'show_correct_answers',
        ])->all())->save();

        return $quiz->refresh()->load('questions.options');
    }

    public function changeStatus(Quiz $quiz, string $status): Quiz
    {
        $allowed = [
            'draft' => ['published'],
            'published' => ['archived'],
            'archived' => ['draft'],
        ];

        if (! in_array($status, $allowed[$quiz->status] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition quiz from {$quiz->status} to {$status}."],
            ]);
        }

        if ($status === 'published' && $quiz->questions()->count() === 0) {
            throw ValidationException::withMessages([
                'status' => ['A quiz must have at least one question before publishing.'],
            ]);
        }

        $quiz->forceFill(['status' => $status])->save();

        return $quiz->refresh()->load('questions.options');
    }

    public function delete(Quiz $quiz): void
    {
        $quiz->delete();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createQuestion(Quiz $quiz, array $data): QuizQuestion
    {
        return DB::transaction(function () use ($quiz, $data): QuizQuestion {
            $this->validateOptions($data['type'], $data['options'] ?? []);

            $question = QuizQuestion::create([
                'tenant_id' => $quiz->tenant_id,
                'quiz_id' => $quiz->id,
                'type' => $data['type'],
                'question_text' => $data['question_text'],
                'points' => $data['points'] ?? 1,
                'sort_order' => $data['sort_order'] ?? $this->nextQuestionSortOrder($quiz),
            ]);

            $this->replaceOptions($question, $data['options']);

            return $question->refresh()->load('options');
        });
    }

    /**
     * @param array<string, mixed> $data
     */
    public function updateQuestion(Quiz $quiz, QuizQuestion $question, array $data): QuizQuestion
    {
        $this->ensureQuestionBelongsToQuiz($quiz, $question);

        return DB::transaction(function () use ($question, $data): QuizQuestion {
            $type = $data['type'] ?? $question->type;
            $options = $data['options'] ?? $question->options->map(fn (QuizQuestionOption $option): array => [
                'option_text' => $option->option_text,
                'is_correct' => $option->is_correct,
                'sort_order' => $option->sort_order,
            ])->all();

            $this->validateOptions($type, $options);

            $question->fill(collect($data)->only([
                'type',
                'question_text',
                'points',
                'sort_order',
            ])->all())->save();

            if (array_key_exists('options', $data)) {
                $this->replaceOptions($question, $data['options']);
            }

            return $question->refresh()->load('options');
        });
    }

    public function deleteQuestion(Quiz $quiz, QuizQuestion $question): void
    {
        $this->ensureQuestionBelongsToQuiz($quiz, $question);

        $question->delete();
    }

    private function ensureLessonHierarchy(Course $course, CourseSection $section, CourseLesson $lesson): void
    {
        if (
            $course->tenant_id !== currentTenant()->id
            || $section->tenant_id !== $course->tenant_id
            || $lesson->tenant_id !== $course->tenant_id
            || $section->course_id !== $course->id
            || $lesson->course_id !== $course->id
            || $lesson->course_section_id !== $section->id
        ) {
            throw ValidationException::withMessages([
                'lesson' => ['The selected lesson hierarchy is invalid.'],
            ]);
        }
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function quizPayload(CourseLesson $lesson, array $data, string $status): array
    {
        return [
            'tenant_id' => $lesson->tenant_id,
            'course_id' => $lesson->course_id,
            'course_section_id' => $lesson->course_section_id,
            'course_lesson_id' => $lesson->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'passing_score' => $data['passing_score'] ?? 70,
            'max_attempts' => $data['max_attempts'] ?? 1,
            'time_limit_minutes' => $data['time_limit_minutes'] ?? null,
            'shuffle_questions' => $data['shuffle_questions'] ?? false,
            'shuffle_answers' => $data['shuffle_answers'] ?? false,
            'show_correct_answers' => $data['show_correct_answers'] ?? false,
            'status' => $status,
        ];
    }

    /**
     * @param list<array<string, mixed>> $options
     */
    private function validateOptions(string $type, array $options): void
    {
        if (count($options) < 2) {
            throw ValidationException::withMessages([
                'options' => ['A quiz question must have at least two options.'],
            ]);
        }

        $correctCount = collect($options)->where('is_correct', true)->count();

        if ($type === 'multiple_choice' && $correctCount < 1) {
            throw ValidationException::withMessages([
                'options' => ['A multiple choice question must have at least one correct option.'],
            ]);
        }

        if (in_array($type, ['single_choice', 'true_false'], true) && $correctCount !== 1) {
            throw ValidationException::withMessages([
                'options' => ['Single choice and true/false questions must have exactly one correct option.'],
            ]);
        }

        if ($type === 'true_false' && count($options) !== 2) {
            throw ValidationException::withMessages([
                'options' => ['A true/false question must have exactly two options.'],
            ]);
        }
    }

    /**
     * @param list<array<string, mixed>> $options
     */
    private function replaceOptions(QuizQuestion $question, array $options): void
    {
        $question->options()->delete();

        foreach (array_values($options) as $index => $option) {
            QuizQuestionOption::create([
                'tenant_id' => $question->tenant_id,
                'quiz_question_id' => $question->id,
                'option_text' => $option['option_text'],
                'is_correct' => $option['is_correct'] ?? false,
                'sort_order' => $option['sort_order'] ?? $index + 1,
            ]);
        }
    }

    private function nextQuestionSortOrder(Quiz $quiz): int
    {
        return ((int) $quiz->questions()->max('sort_order')) + 1;
    }

    private function ensureQuestionBelongsToQuiz(Quiz $quiz, QuizQuestion $question): void
    {
        if ($question->tenant_id !== $quiz->tenant_id || $question->quiz_id !== $quiz->id) {
            throw ValidationException::withMessages([
                'question' => ['The selected question is invalid for this quiz.'],
            ]);
        }
    }
}
