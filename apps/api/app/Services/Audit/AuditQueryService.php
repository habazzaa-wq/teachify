<?php

namespace App\Services\Audit;

use App\Models\ActivityLog;
use App\Models\AuditLog;
use App\Models\Course;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class AuditQueryService
{
    /**
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator<int, AuditLog>
     */
    public function auditLogs(Tenant $tenant, TenantUser $viewer, array $filters = []): LengthAwarePaginator
    {
        $query = AuditLog::query()
            ->where('tenant_id', $tenant->id)
            ->when(
                $filters['event_type'] ?? null,
                fn (Builder $query, string $eventType) => $query->where('event_type', $eventType),
            )
            ->when(
                $filters['tenant_user_id'] ?? null,
                fn (Builder $query, int $tenantUserId) => $query->where('tenant_user_id', $tenantUserId),
            )
            ->when(
                $filters['entity_type'] ?? null,
                fn (Builder $query, string $entityType) => $query->where('entity_type', $entityType),
            )
            ->when(
                $filters['entity_id'] ?? null,
                fn (Builder $query, int|string $entityId) => $query->where('entity_id', $entityId),
            )
            ->when(
                ($filters['from'] ?? null) && ($filters['to'] ?? null),
                fn (Builder $query) => $query->whereBetween('created_at', [$filters['from'], $filters['to']]),
            );

        $this->applyInstructorScope($query, $tenant, $viewer);

        return $query->orderByDesc('created_at')->paginate(25);
    }

    /**
     * Fetch a single entity's audit history.
     *
     * @return LengthAwarePaginator<int, AuditLog>
     */
    public function entityHistory(Tenant $tenant, TenantUser $viewer, string $entityType, int|string $entityId): LengthAwarePaginator
    {
        return $this->auditLogs($tenant, $viewer, [
            'entity_type' => $entityType,
            'entity_id' => $entityId,
        ]);
    }

    /**
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator<int, ActivityLog>
     */
    public function activityLogs(Tenant $tenant, TenantUser $viewer, array $filters = []): LengthAwarePaginator
    {
        $query = ActivityLog::query()
            ->where('tenant_id', $tenant->id)
            ->when(
                $filters['activity_type'] ?? null,
                fn (Builder $query, string $activityType) => $query->where('activity_type', $activityType),
            )
            ->when(
                $filters['tenant_user_id'] ?? null,
                fn (Builder $query, int $tenantUserId) => $query->where('tenant_user_id', $tenantUserId),
            )
            ->when(
                $filters['entity_type'] ?? null,
                fn (Builder $query, string $entityType) => $query->where('entity_type', $entityType),
            )
            ->when(
                $filters['entity_id'] ?? null,
                fn (Builder $query, int|string $entityId) => $query->where('entity_id', $entityId),
            )
            ->when(
                ($filters['from'] ?? null) && ($filters['to'] ?? null),
                fn (Builder $query) => $query->whereBetween('created_at', [$filters['from'], $filters['to']]),
            );

        $this->applyInstructorScope($query, $tenant, $viewer);

        return $query->orderByDesc('created_at')->paginate(25);
    }

    /**
     * Own activity for the requesting member (students see only their own).
     *
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator<int, ActivityLog>
     */
    public function myActivity(Tenant $tenant, TenantUser $viewer, array $filters = []): LengthAwarePaginator
    {
        $query = ActivityLog::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $viewer->id)
            ->when(
                $filters['activity_type'] ?? null,
                fn (Builder $query, string $activityType) => $query->where('activity_type', $activityType),
            )
            ->when(
                $filters['entity_type'] ?? null,
                fn (Builder $query, string $entityType) => $query->where('entity_type', $entityType),
            )
            ->when(
                $filters['entity_id'] ?? null,
                fn (Builder $query, int|string $entityId) => $query->where('entity_id', $entityId),
            );

        return $query->orderByDesc('created_at')->paginate(25);
    }

    /**
     * Instructors may only see audit/activity for entities belonging to courses
     * they teach. Tenant owners/admins are unrestricted.
     *
     * @param Builder<AuditLog|ActivityLog> $query
     */
    private function applyInstructorScope(Builder $query, Tenant $tenant, TenantUser $viewer): void
    {
        $authorization = app(\App\Services\Authorization\TenantAuthorizationService::class);

        $isOperator = $authorization->hasRole($viewer->user, $tenant, 'tenant_owner')
            || $authorization->hasRole($viewer->user, $tenant, 'admin');

        if ($isOperator) {
            return;
        }

        $assignedCourseIds = $this->assignedCourseIds($tenant, $viewer);

        if (empty($assignedCourseIds)) {
            $query->whereRaw('1 = 0');

            return;
        }

        // Restrict to entities scoped to assigned courses (course, lesson, quiz,
        // assignment, certificate). Other entity types are hidden.
        $query->where(function (Builder $query) use ($assignedCourseIds): void {
            $query
                ->whereIn('entity_id', $assignedCourseIds)
                ->where('entity_type', 'course');
        });
    }

    /**
     * @return list<int>
     */
    private function assignedCourseIds(Tenant $tenant, TenantUser $viewer): array
    {
        return Course::query()
            ->where('tenant_id', $tenant->id)
            ->where(function (Builder $query) use ($viewer): void {
                $query
                    ->where('created_by_tenant_user_id', $viewer->id)
                    ->orWhere('primary_instructor_tenant_user_id', $viewer->id)
                    ->orWhereHas('instructors', function (Builder $query) use ($viewer): void {
                        $query->where('tenant_user_id', $viewer->id);
                    });
            })
            ->pluck('id')
            ->all();
    }
}
