<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;

class ToggleCommunityReactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'emoji' => ['required', 'string', 'max:32'],
        ];
    }

    public function messages(): array
    {
        return [
            'emoji.required' => 'التفاعل مطلوب.',
            'emoji.max' => 'التفاعل يجب ألا يتجاوز 32 حرفاً.',
        ];
    }
}
