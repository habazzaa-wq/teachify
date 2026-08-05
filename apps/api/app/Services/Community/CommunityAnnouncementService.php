<?php

namespace App\Services\Community;

use App\Events\Community\CommunityAnnouncementPublished;
use App\Models\CommunityAnnouncement;
use App\Models\CommunityChannel;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class CommunityAnnouncementService
{
    public function __construct(
        private readonly CommunityAccessService $access,
        private readonly CommunityMessageService $messages,
    ) {}

    /**
     * List announcements. Published announcements are visible to every member;
     * drafts and scheduled announcements are only visible to moderators.
     *
     * @return Collection<int, CommunityAnnouncement>
     */
    public function list(Tenant $tenant, TenantUser $member, bool $includeDrafts = false): Collection
    {
        $this->bindTenant($tenant);

        return CommunityAnnouncement::query()
            ->where('tenant_id', $tenant->id)
            ->when(! $includeDrafts, fn ($query) => $query
                ->where('status', 'published')
                ->where(fn ($query) => $query
                    ->whereNull('scheduled_at')
                    ->orWhere('scheduled_at', '<=', now())))
            ->with(['channel', 'creator.user'])
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Tenant $tenant, TenantUser $actor, array $data): CommunityAnnouncement
    {
        $this->bindTenant($tenant);
        $this->access->ensureCanModerate($actor, $tenant);

        $channel = CommunityChannel::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', (int) ($data['channel_id'] ?? 0))
            ->firstOrFail();

        $announcement = CommunityAnnouncement::create([
            'tenant_id' => $tenant->id,
            'channel_id' => $channel->id,
            'created_by_tenant_user_id' => $actor->id,
            'title' => $data['title'],
            'body' => $data['body'],
            'scheduled_at' => $data['scheduled_at'] ?? null,
            'published_at' => null,
            'status' => 'draft',
            'metadata' => $data['metadata'] ?? [],
        ])->refresh();

        return $announcement->load(['channel', 'creator.user']);
    }

    public function show(Tenant $tenant, CommunityAnnouncement $announcement): CommunityAnnouncement
    {
        $this->ensureAnnouncementInTenant($tenant, $announcement);

        return $announcement->load(['channel', 'creator.user']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(
        Tenant $tenant,
        CommunityAnnouncement $announcement,
        TenantUser $actor,
        array $data,
    ): CommunityAnnouncement {
        $this->bindTenant($tenant);
        $this->ensureAnnouncementInTenant($tenant, $announcement);
        $this->access->ensureCanModerate($actor, $tenant);
        $this->ensureNotPublished($announcement);

        $announcement->forceFill(collect($data)
            ->only(['title', 'body', 'scheduled_at', 'metadata'])
            ->all())
            ->save();

        return $announcement->refresh()->load(['channel', 'creator.user']);
    }

    public function publish(
        Tenant $tenant,
        CommunityAnnouncement $announcement,
        TenantUser $actor,
    ): CommunityAnnouncement {
        $this->bindTenant($tenant);
        $this->ensureAnnouncementInTenant($tenant, $announcement);
        $this->access->ensureCanModerate($actor, $tenant);

        if ($announcement->status === 'published' && $announcement->published_at !== null) {
            throw ValidationException::withMessages([
                'announcement' => ['This announcement has already been published.'],
            ]);
        }

        $message = $this->messages->create($tenant, $announcement->channel, $actor, [
            'body' => $announcement->body,
            'content_type' => 'announcement',
            'is_announcement' => true,
        ]);

        $announcement->forceFill([
            'status' => 'published',
            'published_at' => now(),
            'scheduled_at' => null,
        ])->save();

        $fresh = $announcement->refresh()->load(['channel', 'creator.user']);

        CommunityAnnouncementPublished::dispatch(
            $this->payload($fresh),
            $this->messages->payload($message, $tenant),
            $tenant->id,
            $announcement->channel_id,
        );

        return $fresh;
    }

    public function delete(Tenant $tenant, CommunityAnnouncement $announcement, TenantUser $actor): void
    {
        $this->bindTenant($tenant);
        $this->ensureAnnouncementInTenant($tenant, $announcement);
        $this->access->ensureCanModerate($actor, $tenant);

        $announcement->delete();
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(CommunityAnnouncement $announcement): array
    {
        return [
            'id' => $announcement->id,
            'channel_id' => $announcement->channel_id,
            'title' => $announcement->title,
            'body' => $announcement->body,
            'status' => $announcement->status,
            'published_at' => $announcement->published_at?->toIso8601String(),
            'created_at' => $announcement->created_at?->toIso8601String(),
        ];
    }

    private function ensureAnnouncementInTenant(Tenant $tenant, CommunityAnnouncement $announcement): void
    {
        if ($announcement->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'announcement' => ['The announcement is invalid for this tenant.'],
            ]);
        }
    }

    private function ensureNotPublished(CommunityAnnouncement $announcement): void
    {
        if ($announcement->status === 'published') {
            throw ValidationException::withMessages([
                'announcement' => ['A published announcement cannot be modified.'],
            ]);
        }
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
