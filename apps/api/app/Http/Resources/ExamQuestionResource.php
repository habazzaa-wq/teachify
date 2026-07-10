<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'examId' => (string) $this->exam_id,
            'questionId' => (string) $this->question_id,
            'section' => $this->section,
            'order' => $this->order,
            'points' => $this->points,
            'question' => $this->whenLoaded('question', fn () => new QuestionResource($this->question)),
        ];
    }
}
