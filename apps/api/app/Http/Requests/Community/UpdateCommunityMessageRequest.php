<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCommunityMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['sometimes', 'required', 'string', 'max:10000'],
            'content_type' => ['sometimes', 'string', Rule::in([
                'text', 'code', 'math', 'announcement', 'image', 'file', 'pdf', 'voice', 'video',
            ])],
        ];
    }

    public function messages(): array
    {
        return [
            'body.required' => 'محتوى الرسالة مطلوب.',
            'body.max' => 'محتوى الرسالة يجب ألا يتجاوز 10000 حرف.',
            'content_type.in' => 'نوع المحتوى غير مدعوم.',
        ];
    }
}
