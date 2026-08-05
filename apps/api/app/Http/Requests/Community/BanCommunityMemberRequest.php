<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;

class BanCommunityMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:525600'],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'duration_minutes.integer' => 'مدة الحظر يجب أن تكون رقماً.',
            'duration_minutes.min' => 'مدة الحظر يجب أن تكون دقيقة واحدة على الأقل.',
            'duration_minutes.max' => 'مدة الحظر يجب ألا تتجاوز سنة واحدة.',
            'reason.max' => 'سبب الحظر يجب ألا يتجاوز 500 حرف.',
        ];
    }
}
