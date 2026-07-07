<?php

namespace App\Policies;

use App\Models\User;
use App\Services\Authorization\PlatformAuthorizationService;

class PlatformAdminPolicy
{
    public function accessPlatform(User $user): bool
    {
        return app(PlatformAuthorizationService::class)->isPlatformSuperAdmin($user);
    }
}
