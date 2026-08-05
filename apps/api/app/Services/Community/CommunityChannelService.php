<?php

namespace App\Services\Community;

use App\Models\CommunityCategory;
use App\Models\CommunityChannel;
use App\Models\CommunityStat;
use App\Models\CommunityThread;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CommunityChannelService
{
    public function __construct(
        private readonly CommunityAccessService $access,
        private readonly CommunityStatsService $stats,
    ) {}

    /**
     * @return Collection<int, CommunityCategory>
     */
    public function categories(Tenant $tenant, TenantUser $member): Collection
    {
        $this->bindTenant($tenant);

        $moderator = $this->access->isModerator($member, $tenant);

        return CommunityCategory::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'active')
            ->when(! $moderator, fn (Builder $query) => $query->where('moderator_only', false))
            ->with(['channels' => fn ($query) => $query
                ->where('status', 'active')
                ->when(! $moderator, fn (Builder $q) => $q->where('is_locked', false))
                ->orderBy('is_pinned', 'desc')
                ->orderBy('sort_order')
                ->withCount('messages'),
            ])
            ->orderBy('sort_order')
            ->get();
    }

    public function channel(Tenant $tenant, int $channelId): CommunityChannel
    {
        $this->bindTenant($tenant);

        return CommunityChannel::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', $channelId)
            ->with(['category', 'lastMessage.author.user'])
            ->firstOrFail();
    }

    public function thread(Tenant $tenant, int $threadId): CommunityThread
    {
        $this->bindTenant($tenant);

        return CommunityThread::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', $threadId)
            ->with(['channel', 'creator.user'])
            ->firstOrFail();
    }

    /**
     * @return Collection<int, CommunityThread>
     */
    public function threads(Tenant $tenant, CommunityChannel $channel, bool $moderator = false): Collection
    {
        $this->ensureChannelInTenant($tenant, $channel);

        return CommunityThread::query()
            ->where('tenant_id', $tenant->id)
            ->where('channel_id', $channel->id)
            ->when(! $moderator, fn (Builder $query) => $query->where('status', 'active')->where('is_locked', false))
            ->orderByDesc('is_pinned')
            ->orderByDesc('last_message_at')
            ->with(['creator.user', 'messages' => fn ($query) => $query->orderByDesc('id')->limit(1)])
            ->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createCategory(Tenant $tenant, TenantUser $actor, array $data): CommunityCategory
    {
        $this->bindTenant($tenant);
        $this->access->ensureCanModerate($actor, $tenant);

        $this->ensureUniqueSlug($tenant, CommunityCategory::class, $data['slug']);

        return CommunityCategory::create([
            'tenant_id' => $tenant->id,
            'slug' => $data['slug'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'icon' => $data['icon'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_default' => (bool) ($data['is_default'] ?? false),
            'allows_questions' => (bool) ($data['allows_questions'] ?? false),
            'moderator_only' => (bool) ($data['moderator_only'] ?? false),
            'status' => 'active',
            'created_by_tenant_user_id' => $actor->id,
        ])->refresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createChannel(Tenant $tenant, TenantUser $actor, array $data): CommunityChannel
    {
        $this->bindTenant($tenant);
        $this->access->ensureCanModerate($actor, $tenant);

        $category = CommunityCategory::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', (int) ($data['category_id'] ?? 0))
            ->firstOrFail();

        $this->ensureUniqueSlug($tenant, CommunityChannel::class, $data['slug']);

        return CommunityChannel::create([
            'tenant_id' => $tenant->id,
            'category_id' => $category->id,
            'slug' => $data['slug'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'] ?? 'general',
            'sort_order' => $data['sort_order'] ?? 0,
            'status' => 'active',
            'is_locked' => (bool) ($data['is_locked'] ?? false),
            'is_pinned' => (bool) ($data['is_pinned'] ?? false),
            'allows_questions' => (bool) ($data['allows_questions'] ?? false),
            'created_by_tenant_user_id' => $actor->id,
        ])->refresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createThread(Tenant $tenant, TenantUser $actor, CommunityChannel $channel, array $data): CommunityThread
    {
        $this->bindTenant($tenant);
        $this->ensureChannelInTenant($tenant, $channel);
        $this->access->ensureCanPost($actor, $tenant, $channel);

        if (! $channel->allows_questions) {
            throw ValidationException::withMessages([
                'channel' => ['This channel does not support threaded questions.'],
            ]);
        }

        $thread = CommunityThread::create([
            'tenant_id' => $tenant->id,
            'channel_id' => $channel->id,
            'title' => $data['title'],
            'created_by_tenant_user_id' => $actor->id,
            'status' => 'active',
            'is_pinned' => false,
            'is_locked' => false,
            'last_message_at' => now(),
        ])->refresh();

        $this->stats->increment($tenant, CommunityStat::TOTAL_THREADS);

        return $thread;
    }

    private function ensureUniqueSlug(Tenant $tenant, string $model, string $slug): void
    {
        $exists = $model::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', Str::slug($slug))
            ->withTrashed()
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'slug' => ['This slug is already in use.'],
            ]);
        }
    }

    private function ensureChannelInTenant(Tenant $tenant, CommunityChannel $channel): void
    {
        if ($channel->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'channel' => ['The channel is invalid for this tenant.'],
            ]);
        }
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
