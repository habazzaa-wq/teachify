<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommunityAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'channel_id' => ['required', 'integer'],
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:10000'],
            'scheduled_at' => ['nullable', 'date'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'channel_id.required' => 'القناة مطلوبة.',
            'channel_id.integer' => 'معرّف القناة يجب أن يكون رقماً.',
            'title.required' => 'عنوان الإعلان مطلوب.',
            'title.max' => 'عنوان الإعلان يجب ألا يتجاوز 255 حرفاً.',
            'body.required' => 'محتوى الإعلان مطلوب.',
            'body.max' => 'محتوى الإعلان يجب ألا يتجاوز 10000 حرف.',
            'scheduled_at.date' => 'تاريخ النشر المجدول غير صالح.',
        ];
    }
}
