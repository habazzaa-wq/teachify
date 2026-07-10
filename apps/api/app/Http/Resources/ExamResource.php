<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'uuid' => $this->uuid,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'category' => $this->category,
            'status' => $this->status,
            'visibility' => $this->visibility,
            'language' => $this->language,
            'duration' => $this->duration,
            'passingScore' => $this->passing_score,
            'totalPoints' => $this->total_points,
            'questionCount' => $this->question_count,
            'attemptLimit' => $this->attempt_limit,
            'shuffleQuestions' => $this->shuffle_questions,
            'shuffleChoices' => $this->shuffle_choices,
            'showResults' => $this->show_results,
            'showCorrectAnswers' => $this->show_correct_answers,
            'allowReview' => $this->allow_review,
            'negativeMarking' => $this->negative_marking,
            'certificateEligible' => $this->certificate_eligible,
            'randomQuestionPool' => $this->random_question_pool ?? new \stdClass(),
            'pinned' => $this->pinned,
            'featured' => $this->featured,
            'favorite' => (($this->metadata ?? [])['favorite'] ?? false),
            'questionCountRelation' => $this->whenCounted('examQuestions', fn () => $this->exam_questions_count),
            'attemptCount' => $this->whenCounted('attempts', fn () => $this->attempts_count),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => (string) $this->creator->id,
                'name' => $this->creator->user?->name,
            ]),
            'questions' => $this->whenLoaded('examQuestions', fn () => ExamQuestionResource::collection($this->examQuestions)),
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
            'publishedAt' => $this->published_at?->toIso8601String(),
            'archivedAt' => $this->archived_at?->toIso8601String(),
            'deletedAt' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
