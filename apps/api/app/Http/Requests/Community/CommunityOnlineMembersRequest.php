<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;

class CommunityOnlineMembersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'channel_id' => ['nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'channel_id.integer' => 'معرّف القناة يجب أن يكون رقماً.',
        ];
    }
}
