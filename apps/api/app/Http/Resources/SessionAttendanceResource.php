<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionAttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'tenantId' => (string) $this->tenant_id,
            'courseSessionId' => (string) $this->course_session_id,
            'courseSessionEnrollmentId' => $this->course_session_enrollment_id ? (string) $this->course_session_enrollment_id : null,
            'tenantUserId' => (string) $this->tenant_user_id,
            'status' => $this->status,
            'markedByTenantUserId' => $this->marked_by_tenant_user_id ? (string) $this->marked_by_tenant_user_id : null,
            'markedAt' => $this->marked_at?->toIso8601String(),
            'note' => $this->note,
            'student' => $this->whenLoaded('student', function () {
                $user = $this->student?->user;
                return $this->student ? [
                    'id' => (string) $this->student->id,
                    'name' => $user?->name,
                    'email' => $user?->email,
                ] : null;
            }),
            'markedBy' => $this->whenLoaded('markedBy', function () {
                $user = $this->markedBy?->user;
                return $this->markedBy ? [
                    'id' => (string) $this->markedBy->id,
                    'name' => $user?->name,
                    'email' => $user?->email,
                ] : null;
            }),
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
