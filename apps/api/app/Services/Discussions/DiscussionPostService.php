<?php

namespace App\Services\Discussions;

use App\Models\DiscussionPost;
use App\Models\DiscussionThread;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Security\AuditLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DiscussionPostService
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly DiscussionAccessService $access,
    ) {
    }

    /**
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function list(Tenant $tenant, DiscussionThread $thread, bool $includeModerated = false, int $perPage = 50): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $this->ensureThreadInTenant($tenant, $thread);

        $query = DiscussionPost::query()
            ->where('tenant_id', $tenant->id)
            ->where('discussion_thread_id', $thread->id)
            ->when(
                $includeModerated,
                fn (Builder $query) => $query,
                fn (Builder $query) => $query->where('status', 'active'),
            )
            ->orderBy('created_at')
            ->with(['author.user', 'parent']);

        return $query->paginate($perPage);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(
        Tenant $tenant,
        DiscussionThread $thread,
        TenantUser $author,
        array $data,
    ): DiscussionPost {
        $this->bindTenant($tenant);
        $this->ensureThreadInTenant($tenant, $thread);
        $this->ensureAuthorInTenant($tenant, $author);
        $this->ensurePostable($tenant, $thread, $author);

        if (! empty($data['parent_post_id'])) {
            $this->ensureParentValid($tenant, $thread, (int) $data['parent_post_id']);
        }

        return DB::transaction(function () use ($tenant, $thread, $author, $data): DiscussionPost {
            $post = DiscussionPost::create([
                'tenant_id' => $tenant->id,
                'discussion_thread_id' => $thread->id,
                'tenant_user_id' => $author->id,
                'parent_post_id' => $data['parent_post_id'] ?? null,
                'body' => $data['body'],
                'status' => 'active',
                'edited_at' => null,
                'deleted_at' => null,
                'metadata' => $data['metadata'] ?? [],
            ])->refresh();

            $thread->forceFill(['last_activity_at' => now()])->save();

            return $post;
        });
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(Tenant $tenant, DiscussionPost $post, TenantUser $author, array $data): DiscussionPost
    {
        $this->bindTenant($tenant);
        $this->ensurePostInTenant($tenant, $post);
        $this->ensureOwnsPost($post, $author);
        $this->ensureEditable($post);

        $post->forceFill([
            'body' => $data['body'] ?? $post->body,
            'edited_at' => now(),
        ])->save();

        return $post->refresh();
    }

    public function delete(Tenant $tenant, DiscussionPost $post, TenantUser $actor): DiscussionPost
    {
        $this->bindTenant($tenant);
        $this->ensurePostInTenant($tenant, $post);
        $this->ensureActorCanDelete($post, $actor);

        $post->forceFill([
            'status' => 'deleted',
            'deleted_at' => now(),
        ])->save();

        $this->audit->record('discussion.post.deleted', [
            'tenant_id' => $tenant->id,
            'post_id' => $post->id,
            'actor_id' => $actor->id,
            'self' => $post->tenant_user_id === $actor->id,
        ]);

        return $post->refresh();
    }

    private function ensurePostable(Tenant $tenant, DiscussionThread $thread, TenantUser $author): void
    {
        if ($thread->status === 'archived') {
            throw ValidationException::withMessages([
                'thread' => ['Archived threads are read-only.'],
            ]);
        }

        if ($thread->is_locked && ! $this->access->isModerator($author, $tenant, $thread)) {
            throw ValidationException::withMessages([
                'thread' => ['This thread is locked.'],
            ]);
        }
    }

    private function ensureParentValid(Tenant $tenant, DiscussionThread $thread, int $parentId): void
    {
        $exists = DiscussionPost::query()
            ->where('tenant_id', $tenant->id)
            ->where('discussion_thread_id', $thread->id)
            ->where('id', $parentId)
            ->where('status', 'active')
            ->exists();

        if (! $exists) {
            throw ValidationException::withMessages([
                'parent_post_id' => ['The selected parent post is invalid.'],
            ]);
        }
    }

    private function ensureOwnsPost(DiscussionPost $post, TenantUser $author): void
    {
        if ($post->tenant_user_id !== $author->id) {
            throw ValidationException::withMessages([
                'post' => ['You may only edit your own posts.'],
            ]);
        }
    }

    private function ensureActorCanDelete(DiscussionPost $post, TenantUser $actor): void
    {
        if ($post->tenant_user_id !== $actor->id) {
            throw ValidationException::withMessages([
                'post' => ['You may only delete your own posts.'],
            ]);
        }
    }

    private function ensureEditable(DiscussionPost $post): void
    {
        if ($post->status === 'deleted') {
            throw ValidationException::withMessages([
                'post' => ['Deleted posts cannot be edited.'],
            ]);
        }
    }

    private function ensureAuthorInTenant(Tenant $tenant, TenantUser $author): void
    {
        if ($author->tenant_id !== $tenant->id || $author->status !== 'active') {
            throw ValidationException::withMessages([
                'tenant_user_id' => ['The post author is invalid for this tenant.'],
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

    private function ensurePostInTenant(Tenant $tenant, DiscussionPost $post): void
    {
        if ($post->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'post' => ['The discussion post is invalid for this tenant.'],
            ]);
        }
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
