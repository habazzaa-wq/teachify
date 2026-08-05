<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;

class CommunityTypingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'is_typing' => ['required', 'boolean'],
            'thread_id' => ['nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'is_typing.required' => 'حالة الكتابة مطلوبة.',
            'is_typing.boolean' => 'حالة الكتابة يجب أن تكون صحيحة أو خاطئة.',
            'thread_id.integer' => 'معرّف الموضوع يجب أن يكون رقماً.',
        ];
    }
}
