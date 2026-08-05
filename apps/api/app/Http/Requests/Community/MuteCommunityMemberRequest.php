<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;

class MuteCommunityMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:525600'],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'duration_minutes.required' => 'مدة الكتم مطلوبة.',
            'duration_minutes.integer' => 'مدة الكتم يجب أن تكون رقماً.',
            'duration_minutes.min' => 'مدة الكتم يجب أن تكون دقيقة واحدة على الأقل.',
            'duration_minutes.max' => 'مدة الكتم يجب ألا تتجاوز سنة واحدة.',
            'reason.max' => 'سبب الكتم يجب ألا يتجاوز 500 حرف.',
        ];
    }
}
