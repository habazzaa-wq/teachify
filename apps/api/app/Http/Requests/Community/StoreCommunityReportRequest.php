<?php

namespace App\Http\Requests\Community;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommunityReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'سبب البلاغ مطلوب.',
            'reason.max' => 'سبب البلاغ يجب ألا يتجاوز 255 حرفاً.',
            'note.max' => 'التفاصيل يجب ألا تتجاوز 2000 حرف.',
        ];
    }
}
