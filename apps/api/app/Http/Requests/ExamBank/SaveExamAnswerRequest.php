<?php

namespace App\Http\Requests\ExamBank;

use Illuminate\Foundation\Http\FormRequest;

class SaveExamAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'answer' => ['required'],
        ];
    }
}
