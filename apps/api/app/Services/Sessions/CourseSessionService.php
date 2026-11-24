<?php

namespace App\Services\Sessions;

use App\Models\Course;
use App\Models\CourseSession;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CourseSessionService
{
    public function __construct(
        private readonly CourseSessionEnrollmentSyncService $syncService,
        private readonly SessionNotificationService $notifications,
    ) {
    }

    public function create(Tenant $tenant, Course $course, TenantUser $creator, array $data): CourseSession
    {
        $this->ensureCourseInTenant($tenant, $course);
        $this->validatePayload($tenant, $data);

        $status = $data['status'] ?? CourseSession::STATUS_DRAFT;
        if (! in_array($status, [CourseSession::STATUS_DRAFT, CourseSession::STATUS_SCHEDULED], true)) {
            throw ValidationException::withMessages(['status' => ['Invalid initial session status.']]);
        }

        $session = CourseSession::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'created_by_tenant_user_id' => $creator->id,
            'instructor_tenant_user_id' => $data['instructor_tenant_user_id'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'session_type' => $data['session_type'],
            'status' => $status,
            'starts_at_utc' => $data['starts_at_utc'],
            'ends_at_utc' => $data['ends_at_utc'],
            'timezone' => $data['timezone'] ?? ($tenant->timezone ?: 'UTC'),
            'meeting_url' => $data['meeting_url'] ?? null,
            'meeting_provider' => $data['meeting_provider'] ?? null,
            'location_name' => $data['location_name'] ?? null,
            'location_address' => $data['location_address'] ?? null,
            'location_latitude' => $data['location_latitude'] ?? null,
            'location_longitude' => $data['location_longitude'] ?? null,
            'location_maps_url' => $data['location_maps_url'] ?? null,
            'metadata' => $data['metadata'] ?? null,
        ]);

        DB::afterCommit(function () use ($tenant, $session) {
            $fresh = $session->fresh();
            $this->syncService->syncSession($fresh);
            if ($fresh->status === CourseSession::STATUS_SCHEDULED) {
                $this->notifications->onSessionScheduled($tenant, $fresh);
            }
        });

        return $session->refresh()->load(['instructor.user', 'course']);
    }

    public function update(Tenant $tenant, CourseSession $session, array $data): CourseSession
    {
        $this->ensureSessionInTenant($tenant, $session);
        $this->validatePayload($tenant, $data, $session);

        $oldStatus = $session->status;
        $oldStarts = $session->starts_at_utc?->toIso8601String();
        $session->fill(collect($data)->only([
            'title', 'description', 'session_type', 'starts_at_utc', 'ends_at_utc', 'timezone',
            'instructor_tenant_user_id', 'meeting_url', 'meeting_provider', 'location_name',
            'location_address', 'location_latitude', 'location_longitude', 'location_maps_url', 'metadata',
        ])->all());

        if (array_key_exists('status', $data)) {
            $this->applyStatus($session, $data['status'], $data['cancellation_reason'] ?? null);
        }

        $timeChanged = $oldStarts !== $session->starts_at_utc?->toIso8601String();
        if ($timeChanged && $session->status === CourseSession::STATUS_SCHEDULED) {
            $session->rescheduled_from_starts_at_utc = $session->getOriginal('starts_at_utc');
        }

        $session->save();

        // Keep linked studio lesson items in sync with session title/description.
        \App\Models\CourseLesson::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('course_session_id', $session->id)
            ->update([
                'title' => $session->title,
                'short_description' => $session->description,
            ]);

        $fresh = $session->refresh()->load(['instructor.user', 'course']);

        DB::afterCommit(function () use ($tenant, $fresh, $oldStatus, $timeChanged) {
            if ($fresh->status === CourseSession::STATUS_SCHEDULED && $oldStatus !== CourseSession::STATUS_SCHEDULED) {
                $this->notifications->onSessionScheduled($tenant, $fresh);
            } elseif ($fresh->status === CourseSession::STATUS_SCHEDULED && $timeChanged) {
                $this->notifications->onSessionRescheduled($tenant, $fresh);
            }
            if ($fresh->status === CourseSession::STATUS_CANCELLED && $oldStatus !== CourseSession::STATUS_CANCELLED) {
                $this->notifications->onSessionCancelled($tenant, $fresh);
            }
        });

        return $fresh;
    }

    public function schedule(Tenant $tenant, CourseSession $session): CourseSession
    {
        $oldStatus = $session->status;
        // Never publish (and notify) an incomplete session.
        $this->validatePayload($tenant, ['status' => CourseSession::STATUS_SCHEDULED], $session);
        $this->applyStatus($session, CourseSession::STATUS_SCHEDULED);
        $session->save();
        $fresh = $session->refresh();
        if ($oldStatus !== CourseSession::STATUS_SCHEDULED) {
            DB::afterCommit(fn () => $this->notifications->onSessionScheduled($tenant, $fresh->fresh()));
        }
        return $fresh;
    }

    public function cancel(Tenant $tenant, CourseSession $session, ?string $reason = null): CourseSession
    {
        $oldStatus = $session->status;
        $this->applyStatus($session, CourseSession::STATUS_CANCELLED, $reason);
        $session->cancelled_at = now();
        $session->cancellation_reason = $reason;
        $session->save();
        $fresh = $session->refresh();
        if ($oldStatus !== CourseSession::STATUS_CANCELLED) {
            DB::afterCommit(fn () => $this->notifications->onSessionCancelled($tenant, $fresh->fresh()));
        }
        return $fresh;
    }

    public function complete(Tenant $tenant, CourseSession $session): CourseSession
    {
        $this->applyStatus($session, CourseSession::STATUS_COMPLETED);
        $session->save();
        DB::afterCommit(fn () => $this->notifications->onSessionCompleted($tenant, $session->fresh()));
        return $session->refresh();
    }

    private function applyStatus(CourseSession $session, string $target, ?string $reason = null): void
    {
        $allowed = [
            CourseSession::STATUS_DRAFT => [CourseSession::STATUS_SCHEDULED, CourseSession::STATUS_CANCELLED],
            CourseSession::STATUS_SCHEDULED => [CourseSession::STATUS_CANCELLED, CourseSession::STATUS_COMPLETED, CourseSession::STATUS_SCHEDULED],
            CourseSession::STATUS_CANCELLED => [],
            CourseSession::STATUS_COMPLETED => [],
        ];

        if ($session->status === $target) {
            return;
        }

        if (! in_array($target, $allowed[$session->status] ?? [], true)) {
            throw ValidationException::withMessages(['status' => ["Cannot transition session from {$session->status} to {$target}."]]);
        }

        $session->status = $target;
        if ($target === CourseSession::STATUS_CANCELLED) {
            $session->cancelled_at = now();
            $session->cancellation_reason = $reason;
        }
    }

    private function validatePayload(Tenant $tenant, array $data, ?CourseSession $session = null): void
    {
        $type = $data['session_type'] ?? $session?->session_type;
        $meeting = array_key_exists('meeting_url', $data) ? $data['meeting_url'] : $session?->meeting_url;
        $locationName = array_key_exists('location_name', $data) ? $data['location_name'] : $session?->location_name;
        $locationAddress = array_key_exists('location_address', $data) ? $data['location_address'] : $session?->location_address;
        $maps = array_key_exists('location_maps_url', $data) ? $data['location_maps_url'] : $session?->location_maps_url;

        // Drafts are internal placeholders (the course studio creates them before
        // the instructor fills in the meeting details), so only published
        // sessions need a meeting link or a location.
        $targetStatus = $data['status'] ?? $session?->status ?? CourseSession::STATUS_DRAFT;
        $isDraft = $targetStatus === CourseSession::STATUS_DRAFT;

        if (! $isDraft && $type === CourseSession::DELIVERY_TYPE_LIVE && blank($meeting)) {
            throw ValidationException::withMessages(['meeting_url' => ['Meeting URL is required for live sessions.']]);
        }
        if (! $isDraft && in_array($type, [CourseSession::DELIVERY_TYPE_FIELD, CourseSession::DELIVERY_TYPE_OFFLINE], true)
            && blank($locationName) && blank($locationAddress) && blank($maps)) {
            throw ValidationException::withMessages(['location_name' => ['Location information is required for field/offline sessions.']]);
        }

        if (! empty($data['instructor_tenant_user_id'])) {
            $ok = TenantUser::query()->where('tenant_id', $tenant->id)->where('id', $data['instructor_tenant_user_id'])->where('status', 'active')->exists();
            if (! $ok) {
                throw ValidationException::withMessages(['instructor_tenant_user_id' => ['Invalid instructor.']]);
            }
        }
    }

    private function ensureCourseInTenant(Tenant $tenant, Course $course): void
    {
        if ($course->tenant_id !== $tenant->id) {
            abort(404);
        }
    }

    private function ensureSessionInTenant(Tenant $tenant, CourseSession $session): void
    {
        if ($session->tenant_id !== $tenant->id) {
            abort(404);
        }
    }
}
