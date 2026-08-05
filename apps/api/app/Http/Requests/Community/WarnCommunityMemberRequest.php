<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;

class WarnCommunityMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'سبب الإنذار مطلوب.',
            'reason.max' => 'سبب الإنذار يجب ألا يتجاوز 500 حرف.',
        ];
    }
}
