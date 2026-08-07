<?php

use App\Models\CommunityCategory;
use App\Models\CommunityChannel;
use App\Models\CommunityThread;
use App\Models\Tenant;
use App\Services\Community\CommunityAccessService;
use App\Services\Community\CommunityParticipantService;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Realtime channels for the Student Community. Every community channel is
| tenant-scoped and requires an active tenant membership. Channel names
| follow the pattern:
|
|   community.tenant.{tenantId}.channel.{channelId}
|   community.tenant.{tenantId}.thread.{threadId}
|   community.tenant.{tenantId}                  (tenant-wide notifications)
|   presence-community.tenant.{tenantId}         (online presence roster)
|
*/

if (! function_exists('communityAuthorize')) {
    function communityAuthorize(Tenant $tenant, object $user): bool
    {
        $membership = app(App\Services\Auth\TenantMembershipService::class)->activeMembership($user, $tenant);

        return $membership !== null;
    }
}

Broadcast::channel('community.tenant.{tenantId}.channel.{channelId}', function ($user, int $tenantId, int $channelId) {
    $tenant = Tenant::query()->whereKey($tenantId)->first();

    if (! $tenant || ! communityAuthorize($tenant, $user)) {
        return false;
    }

    $channel = CommunityChannel::query()
        ->where('tenant_id', $tenantId)
        ->whereKey($channelId)
        ->with('category')
        ->first();

    if (! $channel) {
        return false;
    }

    app()->instance(Tenant::class, $tenant);
    app()->instance('currentTenant', $tenant);

    $membership = app(App\Services\Auth\TenantMembershipService::class)->activeMembership($user, $tenant);
    app()->instance(App\Models\TenantUser::class, $membership);
    app()->instance('currentTenantMembership', $membership);

    $access = app(CommunityAccessService::class);
    $category = $channel->category ?? new CommunityCategory(['tenant_id' => $tenantId, 'status' => 'active']);

    return $access->canViewChannel($membership, $tenant, $channel, $category);
});

Broadcast::channel('community.tenant.{tenantId}.thread.{threadId}', function ($user, int $tenantId, int $threadId) {
    $tenant = Tenant::query()->whereKey($tenantId)->first();

    if (! $tenant || ! communityAuthorize($tenant, $user)) {
        return false;
    }

    $thread = CommunityThread::query()
        ->where('tenant_id', $tenantId)
        ->whereKey($threadId)
        ->with('channel')
        ->first();

    if (! $thread) {
        return false;
    }

    app()->instance(Tenant::class, $tenant);
    app()->instance('currentTenant', $tenant);

    $membership = app(App\Services\Auth\TenantMembershipService::class)->activeMembership($user, $tenant);
    app()->instance(App\Models\TenantUser::class, $membership);
    app()->instance('currentTenantMembership', $membership);

    return app(CommunityAccessService::class)->canViewChannel(
        $membership,
        $tenant,
        $thread->channel,
        $thread->channel->category ?? new CommunityCategory(['tenant_id' => $tenantId, 'status' => 'active']),
    );
});

Broadcast::channel('community.tenant.{tenantId}', function ($user, int $tenantId) {
    $tenant = Tenant::query()->whereKey($tenantId)->first();

    return $tenant && communityAuthorize($tenant, $user);
});

Broadcast::channel('presence-community.tenant.{tenantId}', function ($user, int $tenantId) {
    $tenant = Tenant::query()->whereKey($tenantId)->first();

    if (! $tenant || ! communityAuthorize($tenant, $user)) {
        return false;
    }

    app()->instance(Tenant::class, $tenant);
    app()->instance('currentTenant', $tenant);

    $membership = app(App\Services\Auth\TenantMembershipService::class)->activeMembership($user, $tenant);
    app()->instance(App\Models\TenantUser::class, $membership);
    app()->instance('currentTenantMembership', $membership);

    return app(CommunityParticipantService::class)->presencePayload($tenant, $membership);
});
