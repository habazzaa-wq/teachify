<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamAttemptResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'examId' => (string) $this->exam_id,
            'userId' => $this->user_id ? (string) $this->user_id : null,
            'score' => $this->score,
            'maxScore' => $this->max_score,
            'passed' => $this->passed,
            'status' => $this->status,
            'durationSeconds' => $this->duration_seconds,
            'startedAt' => $this->started_at?->toIso8601String(),
            'submittedAt' => $this->submitted_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
