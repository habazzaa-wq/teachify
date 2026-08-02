<?php

namespace App\Services\ExamBank\DTO;

/**
 * A single question as exposed to a student inside an exam session.
 * The content is sanitized so correct answers are only revealed for
 * submitted attempts when the exam allows showing correct answers.
 */
final readonly class ExamSessionQuestionDto
{
    /**
     * @param  array<string, mixed>  $content  sanitized question content
     * @param  array<int, string>|string|null  $answer  stored student answer (list of option ids, or "true"/"false")
     */
    public function __construct(
        public int $examQuestionId,
        public int $questionId,
        public string $type,
        public string $title,
        public ?string $description,
        public int $points,
        public int $order,
        public ?string $section,
        public array $content,
        public array|string|null $answer,
        public bool $answered,
        public ?bool $isCorrect,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'examQuestionId' => (string) $this->examQuestionId,
            'questionId' => (string) $this->questionId,
            'type' => $this->type,
            'title' => $this->title,
            'description' => $this->description,
            'points' => $this->points,
            'order' => $this->order,
            'section' => $this->section,
            'content' => $this->content,
            'answer' => $this->answer,
            'answered' => $this->answered,
            'isCorrect' => $this->isCorrect,
        ];
    }
}
