<?php

namespace App\Policies;

use App\Models\Tenant;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;

class TenantInvitationPolicy
{
    public function create(User $user, Tenant $tenant): bool
    {
        return app(TenantAuthorizationService::class)
            ->hasPermission($user, $tenant, 'users.invite');
    }
}
