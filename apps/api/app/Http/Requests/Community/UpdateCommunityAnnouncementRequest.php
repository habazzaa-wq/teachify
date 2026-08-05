<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCommunityAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'body' => ['sometimes', 'required', 'string', 'max:10000'],
            'scheduled_at' => ['nullable', 'date'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'عنوان الإعلان مطلوب.',
            'title.max' => 'عنوان الإعلان يجب ألا يتجاوز 255 حرفاً.',
            'body.required' => 'محتوى الإعلان مطلوب.',
            'body.max' => 'محتوى الإعلان يجب ألا يتجاوز 10000 حرف.',
            'scheduled_at.date' => 'تاريخ النشر المجدول غير صالح.',
        ];
    }
}
