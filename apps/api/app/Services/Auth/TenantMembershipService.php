<?php

namespace App\Services\Auth;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

class TenantMembershipService
{
    public function activeMembership(User $user, Tenant $tenant): ?TenantUser
    {
        return TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();
    }

    /**
     * @throws AuthorizationException
     */
    public function requireActiveMembership(User $user, Tenant $tenant): TenantUser
    {
        $membership = $this->activeMembership($user, $tenant);

        if (! $membership) {
            throw new AuthorizationException('Active tenant membership required.');
        }

        return $membership;
    }

    public function touchLastAccessed(TenantUser $membership): void
    {
        $membership->forceFill(['last_accessed_at' => now()])->save();
    }
}
