<?php

namespace App\Services\ExamBank;

use App\Models\Question;
use RuntimeException;

/**
 * Scores a single question against the stored student answer.
 * Extend this class to support additional question types.
 */
class ExamAnswerGrader
{
    public function grade(Question $question, mixed $answer): bool
    {
        return match ($question->type) {
            'single_choice', 'multiple_choice' => $this->gradeChoice($question, $answer),
            'true_false' => $this->gradeTrueFalse($question, $answer),
            'numeric' => $this->gradeNumeric($question, $answer),
            'essay', 'short_answer' => false,
            default => throw new RuntimeException("Unsupported question type [{$question->type}] for auto-grading."),
        };
    }

    private function gradeChoice(Question $question, mixed $answer): bool
    {
        if (! is_array($answer)) {
            return false;
        }

        $selected = ExamAnswerNormalizer::ids($answer);
        $correct = ExamAnswerNormalizer::ids(
            collect($question->content['options'] ?? [])
                ->where('correct', true)
                ->pluck('id')
                ->all(),
        );

        return $selected === $correct;
    }

    private function gradeTrueFalse(Question $question, mixed $answer): bool
    {
        $expected = $question->content['correct'] ?? null;

        return is_string($answer) && is_string($expected) && $answer === $expected;
    }

    private function gradeNumeric(Question $question, mixed $answer): bool
    {
        $expected = $question->content['answer'] ?? $question->content['correct'] ?? null;

        if (! is_string($answer) || ! is_numeric($answer) || ! is_numeric($expected)) {
            return false;
        }

        $tolerance = (float) ($question->content['tolerance'] ?? 0);

        return abs((float) $answer - (float) $expected) <= $tolerance;
    }
}
