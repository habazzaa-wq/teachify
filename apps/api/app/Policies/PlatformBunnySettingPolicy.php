<?php

namespace App\Policies;

use App\Models\User;
use App\Services\Authorization\PlatformAuthorizationService;

class PlatformBunnySettingPolicy
{
    public function __construct(
        private readonly PlatformAuthorizationService $authorization,
    ) {
    }

    public function view(User $user): bool
    {
        return $this->authorization->isPlatformSuperAdmin($user);
    }

    public function update(User $user): bool
    {
        return $this->authorization->isPlatformSuperAdmin($user);
    }

    public function verify(User $user): bool
    {
        return $this->authorization->isPlatformSuperAdmin($user);
    }

    public function health(User $user): bool
    {
        return $this->authorization->isPlatformSuperAdmin($user);
    }

    public function rotate(User $user): bool
    {
        return $this->authorization->isPlatformSuperAdmin($user);
    }

    public function reveal(User $user): bool
    {
        return $this->authorization->isPlatformSuperAdmin($user);
    }

    public function disable(User $user): bool
    {
        return $this->authorization->isPlatformSuperAdmin($user);
    }

    public function deleteCredentials(User $user): bool
    {
        return $this->authorization->isPlatformSuperAdmin($user);
    }

    public function reset(User $user): bool
    {
        return $this->authorization->isPlatformSuperAdmin($user);
    }
}
