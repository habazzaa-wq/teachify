<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Lightweight representation of the single active exam attempt the current
 * student still has running. Used by the global "persistent active exam
 * reminder" so any page can surface an unfinished exam without loading the
 * full session payload.
 */
class ExamActiveAttemptResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $remaining = null;

        if ($this->status === 'in_progress' && $this->timer_ends_at !== null) {
            $remaining = max(0, $this->timer_ends_at->getTimestamp() - now()->getTimestamp());
        }

        $exam = $this->relationLoaded('exam') ? $this->exam : $this->exam()->first();

        return [
            'id' => (string) $this->id,
            'examId' => (string) $this->exam_id,
            'status' => $this->status,
            'isOfficial' => $this->is_official,
            'isPractice' => $this->is_practice,
            'currentQuestionIndex' => $this->current_question_index,
            'timerEndsAt' => $this->timer_ends_at?->toIso8601String(),
            'remainingSeconds' => $remaining,
            'exam' => $exam !== null ? [
                'id' => (string) $exam->id,
                'title' => $exam->title,
            ] : null,
        ];
    }
}
