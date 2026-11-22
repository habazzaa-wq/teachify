<?php

namespace App\Http\Requests\Api\v1\Sessions;

use App\Models\SessionAttendance;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MarkAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(SessionAttendance::STATUSES)],
            'note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
