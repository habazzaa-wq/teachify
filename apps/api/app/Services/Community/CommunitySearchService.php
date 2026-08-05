<?php

namespace App\Services\Community;

use App\Models\CommunityMessage;
use App\Models\CommunityThread;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Pagination\LengthAwarePaginator;

class CommunitySearchService
{
    /**
     * @return array{ messages: LengthAwarePaginator, threads: LengthAwarePaginator }
     */
    public function search(Tenant $tenant, TenantUser $member, string $query, array $filters = []): array
    {
        $this->bindTenant($tenant);

        $messages = $this->searchMessages($tenant, $member, $query, $filters);
        $threads = $this->searchThreads($tenant, $member, $query, $filters);

        return [
            'messages' => $messages,
            'threads' => $threads,
        ];
    }

    private function searchMessages(Tenant $tenant, TenantUser $member, string $query, array $filters): LengthAwarePaginator
    {
        $builder = CommunityMessage::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'active');

        if ($query !== '') {
            $builder->where('body_text', 'like', '%'.$query.'%');
        }

        if (isset($filters['channel_id'])) {
            $builder->where('channel_id', (int) $filters['channel_id']);
        }

        if (! empty($filters['visible_channel_ids'])) {
            $builder->whereIn('channel_id', $filters['visible_channel_ids']);
        }

        if (isset($filters['author_id'])) {
            $builder->where('tenant_user_id', (int) $filters['author_id']);
        }

        if (! empty($filters['has_attachments'])) {
            $builder->whereHas('attachments');
        }

        if (isset($filters['from'])) {
            $builder->where('created_at', '>=', $filters['from']);
        }

        if (isset($filters['to'])) {
            $builder->where('created_at', '<=', $filters['to']);
        }

        return $builder
            ->orderByDesc('id')
            ->with(['author.user', 'channel', 'attachments.mediaAsset'])
            ->paginate((int) ($filters['per_page'] ?? 20));
    }

    private function searchThreads(Tenant $tenant, TenantUser $member, string $query, array $filters): LengthAwarePaginator
    {
        $builder = CommunityThread::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'active');

        if ($query !== '') {
            $builder->where('title', 'like', '%'.$query.'%');
        }

        if (isset($filters['channel_id'])) {
            $builder->where('channel_id', (int) $filters['channel_id']);
        }

        if (! empty($filters['visible_channel_ids'])) {
            $builder->whereIn('channel_id', $filters['visible_channel_ids']);
        }

        return $builder
            ->orderByDesc('last_message_at')
            ->with(['channel', 'creator.user'])
            ->paginate((int) ($filters['per_page'] ?? 20));
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
