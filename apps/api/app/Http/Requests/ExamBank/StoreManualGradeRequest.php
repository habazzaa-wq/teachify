<?php

namespace App\Http\Requests\ExamBank;

use App\Models\ExamAttemptAnswer;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Teacher manual grade save for one exam attempt answer (Phase E).
 *
 * `manual_score` max is resolved exactly the way PHASE_B1_RECALCULATION.md §3
 * resolves a question's awardable points (`ExamGradingService::grade()` line
 * 54: `max(0, (int) ($examQuestion->points ?? $examQuestion->question?->points ?? 0))`).
 * The same resolution therefore caps the value in BOTH the request validation
 * here and the attempt recalculation in ExamManualGradingService.
 *
 * Authorization is handled at the controller (ExamPolicy::update on the owning
 * exam), and the answer-type / grading-state guards live in the service; this
 * request only validates the wire payload.
 */
class StoreManualGradeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'manual_score' => ['required', 'numeric', 'min:0', 'max:'.$this->maxPoints()],
            // `feedback` column is nullable TEXT (migration
            // 2026_09_08_000001...:37); the only existing feedback-like rule in
            // the repo (assignment grading, AssignmentGradingController.php:27)
            // is `nullable|string`. Picking a 5000-char cap for a text column.
            'feedback' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * The question's awardable max, resolved per B1 §3
     * (ExamGradingService.php:54): exam-question points, else question
     * points, else 0.
     */
    private function maxPoints(): float|int
    {
        $answer = $this->route('answer');

        if (! $answer instanceof ExamAttemptAnswer) {
            return 0;
        }

        return max(0, (int) ($answer->examQuestion?->points ?? $answer->examQuestion?->question?->points ?? 0));
    }
}