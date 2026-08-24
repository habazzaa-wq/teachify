<?php

namespace App\Services\Discussions;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\DiscussionThread;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Security\AuditLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class DiscussionThreadService
{
    public function __construct(
        private readonly AuditLogger $audit,
    ) {
    }

    /**
     * @param array<string, mixed> $filters
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function list(Tenant $tenant, TenantUser $viewer, array $filters = [], int $perPage = 25): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $this->bindTenant($tenant);

        $query = DiscussionThread::query()
            ->where('tenant_id', $tenant->id)
            ->when(
                $filters['course_id'] ?? null,
                fn (Builder $query, $courseId) => $query->where('course_id', $courseId),
            )
            ->when(
                $filters['course_lesson_id'] ?? null,
                fn (Builder $query, $lessonId) => $query->where('course_lesson_id', $lessonId),
            )
            ->when(
                $filters['type'] ?? null,
                fn (Builder $query, $type) => $query->where('type', $type),
            )
            ->when(
                isset($filters['include_archived']) && ! $filters['include_archived'],
                fn (Builder $query) => $query->where('status', '!=', 'archived'),
            )
            ->when(
                ! isset($filters['include_archived']),
                fn (Builder $query) => $query->where('status', '!=', 'archived'),
            )
            ->orderByDesc('is_pinned')
            ->orderByDesc('last_activity_at')
            ->orderByDesc('created_at');

        return $query->paginate($perPage);
    }

    public function show(Tenant $tenant, DiscussionThread $thread): DiscussionThread
    {
        $this->ensureThreadInTenant($tenant, $thread);

        return $thread->load(['creator.user', 'course', 'lesson']);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(Tenant $tenant, TenantUser $creator, array $data): DiscussionThread
    {
        $this->bindTenant($tenant);
        $this->ensureCreatorInTenant($tenant, $creator);
        $this->ensureType($data['type'] ?? 'general');
        $this->ensureHierarchy($data);

        $thread = DiscussionThread::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $creator->id,
            'course_id' => $data['course_id'] ?? null,
            'course_section_id' => $data['course_section_id'] ?? null,
            'course_lesson_id' => $data['course_lesson_id'] ?? null,
            'title' => $data['title'],
            'type' => $data['type'] ?? 'general',
            'status' => 'active',
            'is_pinned' => false,
            'is_locked' => false,
            'last_activity_at' => now(),
            'metadata' => $data['metadata'] ?? [],
        ])->refresh();

        return $thread;
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(Tenant $tenant, DiscussionThread $thread, array $data): DiscussionThread
    {
        $this->bindTenant($tenant);
        $this->ensureThreadInTenant($tenant, $thread);
        $this->ensureNotArchived($thread);

        $thread->forceFill([
            'title' => $data['title'] ?? $thread->title,
        ])->save();

        return $thread->refresh();
    }

    public function lock(Tenant $tenant, DiscussionThread $thread, TenantUser $moderator): DiscussionThread
    {
        $this->bindTenant($tenant);
        $this->ensureThreadInTenant($tenant, $thread);
        $this->ensureNotArchived($thread);

        $thread->forceFill(['is_locked' => true])->save();

        $this->audit->record('discussion.thread.locked', [
            'tenant_id' => $tenant->id,
            'thread_id' => $thread->id,
            'moderator_id' => $moderator->id,
        ]);

        return $thread->refresh();
    }

    public function unlock(Tenant $tenant, DiscussionThread $thread, TenantUser $moderator): DiscussionThread
    {
        $this->bindTenant($tenant);
        $this->ensureThreadInTenant($tenant, $thread);

        $thread->forceFill(['is_locked' => false])->save();

        $this->audit->record('discussion.thread.unlocked', [
            'tenant_id' => $tenant->id,
            'thread_id' => $thread->id,
            'moderator_id' => $moderator->id,
        ]);

        return $thread->refresh();
    }

    public function pin(Tenant $tenant, DiscussionThread $thread, TenantUser $moderator): DiscussionThread
    {
        $this->bindTenant($tenant);
        $this->ensureThreadInTenant($tenant, $thread);
        $this->ensureNotArchived($thread);

        $thread->forceFill(['is_pinned' => true])->save();

        $this->audit->record('discussion.thread.pinned', [
            'tenant_id' => $tenant->id,
            'thread_id' => $thread->id,
            'moderator_id' => $moderator->id,
        ]);

        return $thread->refresh();
    }

    public function unpin(Tenant $tenant, DiscussionThread $thread, TenantUser $moderator): DiscussionThread
    {
        $this->bindTenant($tenant);
        $this->ensureThreadInTenant($tenant, $thread);

        $thread->forceFill(['is_pinned' => false])->save();

        $this->audit->record('discussion.thread.unpinned', [
            'tenant_id' => $tenant->id,
            'thread_id' => $thread->id,
            'moderator_id' => $moderator->id,
        ]);

        return $thread->refresh();
    }

    public function archive(Tenant $tenant, DiscussionThread $thread, TenantUser $moderator): DiscussionThread
    {
        $this->bindTenant($tenant);
        $this->ensureThreadInTenant($tenant, $thread);

        $thread->forceFill(['status' => 'archived'])->save();

        $this->audit->record('discussion.thread.archived', [
            'tenant_id' => $tenant->id,
            'thread_id' => $thread->id,
            'moderator_id' => $moderator->id,
        ]);

        return $thread->refresh();
    }

    public function touchActivity(DiscussionThread $thread): void
    {
        $thread->forceFill(['last_activity_at' => now()])->save();
    }

    private function ensureCreatorInTenant(Tenant $tenant, TenantUser $creator): void
    {
        if ($creator->tenant_id !== $tenant->id || $creator->status !== 'active') {
            throw ValidationException::withMessages([
                'created_by_tenant_user_id' => ['The discussion creator is invalid for this tenant.'],
            ]);
        }
    }

    private function ensureThreadInTenant(Tenant $tenant, DiscussionThread $thread): void
    {
        if ($thread->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'thread' => ['The discussion thread is invalid for this tenant.'],
            ]);
        }
    }

    private function ensureNotArchived(DiscussionThread $thread): void
    {
        if ($thread->status === 'archived') {
            throw ValidationException::withMessages([
                'thread' => ['Archived threads are read-only.'],
            ]);
        }
    }

    private function ensureType(string $type): void
    {
        if (! in_array($type, ['course', 'lesson', 'general'], true)) {
            throw ValidationException::withMessages([
                'type' => ['The selected discussion thread type is invalid.'],
            ]);
        }
    }

    /**
     * @param array<string, mixed> $data
     */
    private function ensureHierarchy(array $data): void
    {
        $type = $data['type'] ?? 'general';
        $courseId = $data['course_id'] ?? null;
        $lessonId = $data['course_lesson_id'] ?? null;

        if ($type === 'course' && ! $courseId) {
            throw ValidationException::withMessages([
                'course_id' => ['A course thread requires a course.'],
            ]);
        }

        if ($type === 'lesson' && ! $lessonId) {
            throw ValidationException::withMessages([
                'course_lesson_id' => ['A lesson thread requires a lesson.'],
            ]);
        }

        if ($lessonId) {
            /** @var CourseLesson|null $lesson */
            $lesson = CourseLesson::query()
                ->where('tenant_id', currentTenant()->id)
                ->where('id', $lessonId)
                ->first();

            if (! $lesson) {
                throw ValidationException::withMessages([
                    'course_lesson_id' => ['The selected lesson is invalid.'],
                ]);
            }

            if ($courseId && $lesson->course_id != $courseId) {
                throw ValidationException::withMessages([
                    'course_id' => ['The lesson does not belong to the selected course.'],
                ]);
            }
        }

        if ($courseId) {
            $course = Course::query()
                ->where('tenant_id', currentTenant()->id)
                ->where('id', $courseId)
                ->exists();

            if (! $course) {
                throw ValidationException::withMessages([
                    'course_id' => ['The selected course is invalid.'],
                ]);
            }
        }
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
