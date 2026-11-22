<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'tenantId' => (string) $this->tenant_id,
            'courseId' => (string) $this->course_id,
            'title' => $this->title,
            'description' => $this->description,
            'sessionType' => $this->session_type,
            'status' => $this->status,
            'startsAtUtc' => $this->starts_at_utc?->toIso8601String(),
            'endsAtUtc' => $this->ends_at_utc?->toIso8601String(),
            'timezone' => $this->timezone,
            'meetingUrl' => $this->meeting_url,
            'meetingProvider' => $this->meeting_provider,
            'locationName' => $this->location_name,
            'locationAddress' => $this->location_address,
            'locationLatitude' => $this->location_latitude,
            'locationLongitude' => $this->location_longitude,
            'locationMapsUrl' => $this->location_maps_url,
            'cancellationReason' => $this->cancellation_reason,
            'cancelledAt' => $this->cancelled_at?->toIso8601String(),
            'rescheduledFromStartsAtUtc' => $this->rescheduled_from_starts_at_utc?->toIso8601String(),
            'createdByTenantUserId' => $this->created_by_tenant_user_id ? (string) $this->created_by_tenant_user_id : null,
            'instructorTenantUserId' => $this->instructor_tenant_user_id ? (string) $this->instructor_tenant_user_id : null,
            'instructor' => $this->whenLoaded('instructor', function () {
                $user = $this->instructor?->user;
                return $this->instructor ? [
                    'id' => (string) $this->instructor->id,
                    'name' => $user?->name,
                    'email' => $user?->email,
                ] : null;
            }),
            'enrollmentsCount' => $this->whenCounted('sessionEnrollments'),
            'attendanceSummary' => $this->when(isset($this->attendance_summary), $this->attendance_summary ?? null),
            'metadata' => $this->metadata ?? [],
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
