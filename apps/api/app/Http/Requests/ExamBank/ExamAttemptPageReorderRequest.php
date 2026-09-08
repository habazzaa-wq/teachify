<?php

namespace App\Http\Requests\ExamBank;

use Illuminate\Foundation\Http\FormRequest;

class ExamAttemptPageReorderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'page_ids' => ['required', 'array'],
            'page_ids.*' => ['required', 'integer', 'distinct'],
        ];
    }
}
