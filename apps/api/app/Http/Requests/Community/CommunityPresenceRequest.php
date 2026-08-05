<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;

class CommunityPresenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string'],
            'channel_id' => ['nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'حالة التواجد مطلوبة.',
            'channel_id.integer' => 'معرّف القناة يجب أن يكون رقماً.',
        ];
    }
}
