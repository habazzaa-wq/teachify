<?php

namespace App\Services\ExamBank;

use App\Models\Question;
use Illuminate\Validation\ValidationException;

/**
 * Validates a student answer against the question definition and normalizes it
 * for storage. Extend this class to support additional question types.
 */
class ExamAnswerValidator
{
    /**
     * @return array<int, string>|string normalized answer: list of option ids for choice
     *                                   questions, "true"/"false" for true/false questions
     */
    public function validate(Question $question, mixed $answer): array|string
    {
        return match ($question->type) {
            'single_choice' => $this->validateChoice($question, $answer, exactlyOne: true),
            'multiple_choice' => $this->validateChoice($question, $answer, exactlyOne: false),
            'true_false' => $this->validateTrueFalse($answer),
            'numeric' => $this->validateNumeric($answer),
            default => throw ValidationException::withMessages([
                'answer' => ['This question type is not supported in the exam session yet.'],
            ]),
        };
    }

    /**
     * @return array<int, string>
     */
    private function validateChoice(Question $question, mixed $answer, bool $exactlyOne): array
    {
        if (! is_array($answer)) {
            throw ValidationException::withMessages([
                'answer' => ['The answer must be a list of selected options.'],
            ]);
        }

        $optionIds = collect($question->content['options'] ?? [])
            ->pluck('id')
            ->map(fn (mixed $id): string => (string) $id)
            ->all();

        $selected = ExamAnswerNormalizer::ids($answer);

        if ($selected === []) {
            throw ValidationException::withMessages([
                'answer' => ['Select at least one option.'],
            ]);
        }

        if ($exactlyOne && count($selected) !== 1) {
            throw ValidationException::withMessages([
                'answer' => ['Single choice questions require exactly one selected option.'],
            ]);
        }

        if (array_diff($selected, $optionIds) !== []) {
            throw ValidationException::withMessages([
                'answer' => ['One or more selected options are invalid for this question.'],
            ]);
        }

        return $selected;
    }

    private function validateTrueFalse(mixed $answer): string
    {
        if (! is_string($answer) || ! in_array($answer, ['true', 'false'], true)) {
            throw ValidationException::withMessages([
                'answer' => ['True/false questions require an answer of "true" or "false".'],
            ]);
        }

        return $answer;
    }

    private function validateNumeric(mixed $answer): string
    {
        if (is_int($answer) || is_float($answer)) {
            $answer = (string) $answer;
        }

        if (! is_string($answer) || ! is_numeric(trim($answer))) {
            throw ValidationException::withMessages([
                'answer' => ['Numeric questions require a numeric answer.'],
            ]);
        }

        return trim($answer);
    }
}
