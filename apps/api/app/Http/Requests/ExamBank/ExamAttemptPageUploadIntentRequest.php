<?php

namespace App\Http\Requests\ExamBank;

use Illuminate\Foundation\Http\FormRequest;

class ExamAttemptPageUploadIntentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'original_filename' => ['required', 'string', 'max:255'],
            'mime_type' => ['nullable', 'string', 'max:255'],
            'size_bytes' => ['nullable', 'integer', 'min:0'],
        ];
    }
}