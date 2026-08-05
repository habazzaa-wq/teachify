<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;

class MarkCommunityReadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'last_read_message_id' => ['required', 'integer', 'min:1'],
            'thread_id' => ['nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'last_read_message_id.required' => 'معرّف آخر رسالة مقروءة مطلوب.',
            'last_read_message_id.integer' => 'معرّف آخر رسالة مقروءة يجب أن يكون رقماً.',
            'thread_id.integer' => 'معرّف الموضوع يجب أن يكون رقماً.',
        ];
    }
}
