<?php

namespace App\Services\ExamBank\DTO;

/**
 * Full payload describing an exam session: attempt metadata + ordered questions.
 */
final readonly class ExamSessionData
{
    /**
     * @param  array<string, mixed>  $attempt
     * @param  list<ExamSessionQuestionDto>  $questions
     */
    public function __construct(
        public array $attempt,
        public array $questions,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'attempt' => $this->attempt,
            'questions' => array_map(
                fn (ExamSessionQuestionDto $question): array => $question->toArray(),
                $this->questions,
            ),
        ];
    }
}
