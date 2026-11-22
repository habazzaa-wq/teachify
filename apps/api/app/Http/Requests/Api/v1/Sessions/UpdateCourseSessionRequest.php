<?php

namespace App\Http\Requests\Api\v1\Sessions;

use App\Models\CourseSession;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourseSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = currentTenant()->id;

        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'session_type' => ['sometimes', Rule::in(CourseSession::SESSION_TYPES)],
            'status' => ['sometimes', Rule::in(CourseSession::STATUSES)],
            'starts_at_utc' => ['sometimes', 'date'],
            'ends_at_utc' => ['sometimes', 'date', 'after:starts_at_utc'],
            'timezone' => ['nullable', 'string', 'timezone:all'],
            'instructor_tenant_user_id' => [
                'nullable', 'integer',
                Rule::exists('tenant_users', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)->where('status', 'active')),
            ],
            'meeting_url' => ['nullable', 'url', 'max:2048'],
            'meeting_provider' => ['nullable', 'string', 'max:100'],
            'location_name' => ['nullable', 'string', 'max:255'],
            'location_address' => ['nullable', 'string'],
            'location_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'location_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'location_maps_url' => ['nullable', 'url', 'max:2048'],
            'cancellation_reason' => ['nullable', 'string', 'max:1000'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
