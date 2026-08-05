<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;

class CommunitySearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q' => ['required', 'string', 'max:255'],
            'channel_id' => ['nullable', 'integer'],
            'author_id' => ['nullable', 'integer'],
            'has_attachments' => ['nullable', 'boolean'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'q.required' => 'كلمة البحث مطلوبة.',
            'q.max' => 'كلمة البحث يجب ألا تتجاوز 255 حرفاً.',
            'channel_id.integer' => 'معرّف القناة يجب أن يكون رقماً.',
            'author_id.integer' => 'معرّف العضو يجب أن يكون رقماً.',
            'from.date' => 'تاريخ البداية غير صالح.',
            'to.date' => 'تاريخ النهاية غير صالح.',
            'per_page.integer' => 'عدد العناصر لكل صفحة يجب أن يكون رقماً.',
            'per_page.min' => 'عدد العناصر لكل صفحة يجب أن يكون 1 على الأقل.',
            'per_page.max' => 'عدد العناصر لكل صفحة يجب ألا يتجاوز 100.',
        ];
    }
}
