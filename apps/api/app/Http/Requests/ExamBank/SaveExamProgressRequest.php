<?php

namespace App\Http\Requests\ExamBank;

use Illuminate\Foundation\Http\FormRequest;

class SaveExamProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_question_index' => ['sometimes', 'integer', 'min:0'],
            'events' => ['sometimes', 'array'],
            'events.*.type' => ['required', 'string', 'max:64'],
            'events.*.occurred_at' => ['sometimes', 'string', 'max:64'],
            'events.*.meta' => ['sometimes'],
        ];
    }
}
