<?php

namespace App\Http\Requests\Api\v1\Sessions;

use App\Models\CourseSession;
use App\Models\TenantUser;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourseSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = currentTenant()->id;

        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'session_type' => ['required', Rule::in(CourseSession::SESSION_TYPES)],
            'status' => ['sometimes', Rule::in([CourseSession::STATUS_DRAFT, CourseSession::STATUS_SCHEDULED])],
            'starts_at_utc' => ['required', 'date'],
            'ends_at_utc' => ['required', 'date', 'after:starts_at_utc'],
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
            'metadata' => ['nullable', 'array'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $type = $this->input('session_type');
            if ($type === CourseSession::DELIVERY_TYPE_LIVE && ! $this->filled('meeting_url')) {
                $validator->errors()->add('meeting_url', 'Meeting URL is required for live sessions.');
            }
            if (in_array($type, [CourseSession::DELIVERY_TYPE_FIELD, CourseSession::DELIVERY_TYPE_OFFLINE], true)) {
                if (! $this->filled('location_name') && ! $this->filled('location_address') && ! $this->filled('location_maps_url')) {
                    $validator->errors()->add('location_name', 'Location information is required for field/offline sessions.');
                }
            }
        });
    }
}
