<?php

namespace App\Policies;

use App\Models\User;
use App\Services\Authorization\AuthorizationService;

class SettingsPolicy
{
    public function __construct(private readonly AuthorizationService $authorization)
    {
    }

    public function view(User $user): bool
    {
        return $this->authorization->hasPermission($user, 'tenant.manage');
    }

    public function update(User $user): bool
    {
        return $this->authorization->hasPermission($user, 'tenant.manage');
    }

    public function manageDomains(User $user): bool
    {
        return $this->authorization->hasPermission($user, 'tenant.manage');
    }

    public function manageIntegrations(User $user): bool
    {
        return $this->authorization->hasPermission($user, 'tenant.manage');
    }
}
