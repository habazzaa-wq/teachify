<?php

namespace App\Services\Auth;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

class TenantMembershipService
{
    /**
     * last_accessed_at is advisory telemetry, yet it was written on every
     * single authenticated request (one UPDATE per request). Debounce it:
     * skip the write when the stored timestamp is younger than this many
     * seconds. Override via config key "teachify.membership_touch_debounce".
     */
    private const TOUCH_DEBOUNCE_SECONDS = 60;

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
        // The model was loaded moments ago within the same request, so its
        // last_accessed_at attribute is trustworthy for the freshness check —
        // no extra query needed.
        $last = $membership->last_accessed_at;
        $debounce = max(0, (int) config('teachify.membership_touch_debounce', self::TOUCH_DEBOUNCE_SECONDS));

        if ($last !== null && $last->gt(now()->subSeconds($debounce))) {
            return;
        }

        $membership->forceFill(['last_accessed_at' => now()])->save();
    }
}
