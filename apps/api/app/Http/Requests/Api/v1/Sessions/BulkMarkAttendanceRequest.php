<?php

namespace App\Http\Requests\Api\v1\Sessions;

use App\Models\SessionAttendance;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkMarkAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'attendances' => ['required', 'array', 'min:1'],
            'attendances.*.tenant_user_id' => ['required', 'integer'],
            'attendances.*.status' => ['required', Rule::in(SessionAttendance::STATUSES)],
            'attendances.*.note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
