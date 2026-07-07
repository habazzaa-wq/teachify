<?php

namespace App\Services\Authorization;

use App\Models\User;

class PlatformAuthorizationService
{
    public function isPlatformSuperAdmin(User $user): bool
    {
        return $user->isPlatformSuperAdmin();
    }
}
