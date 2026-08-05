<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;

class CommunityMessageListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'thread_id' => ['nullable', 'integer'],
            'author_id' => ['nullable', 'integer'],
            'pinned_only' => ['nullable', 'boolean'],
            'official_only' => ['nullable', 'boolean'],
            'solved_only' => ['nullable', 'boolean'],
            'highlighted_only' => ['nullable', 'boolean'],
            'before_id' => ['nullable', 'integer', 'min:1'],
            'after_id' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'thread_id.integer' => 'معرّف الموضوع يجب أن يكون رقماً.',
            'author_id.integer' => 'معرّف العضو يجب أن يكون رقماً.',
            'before_id.integer' => 'معرّف نقطة التراجع يجب أن يكون رقماً صحيحاً موجباً.',
            'after_id.integer' => 'معرّف نقطة التقدم يجب أن يكون رقماً صحيحاً موجباً.',
            'per_page.integer' => 'عدد العناصر لكل صفحة يجب أن يكون رقماً.',
            'per_page.min' => 'عدد العناصر لكل صفحة يجب أن يكون 1 على الأقل.',
            'per_page.max' => 'عدد العناصر لكل صفحة يجب ألا يتجاوز 100.',
        ];
    }
}
