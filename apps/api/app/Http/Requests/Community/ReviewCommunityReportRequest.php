<?php

namespace App\Http\Requests\Community;

use App\Services\Community\CommunityModerationService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewCommunityReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action' => ['required', Rule::in([
                CommunityModerationService::ACTION_HIDE,
                CommunityModerationService::ACTION_DISMISS,
            ])],
            'note' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'action.required' => 'إجراء المراجعة مطلوب.',
            'action.in' => 'إجراء المراجعة غير صالح.',
            'note.max' => 'الملاحظة يجب ألا تتجاوز 2000 حرف.',
        ];
    }
}
