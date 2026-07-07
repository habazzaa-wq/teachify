<?php

namespace App\Policies;

use App\Models\User;
use App\Services\Authorization\AuthorizationService;

class PermissionPolicy
{
    public function __construct(private readonly AuthorizationService $authorization)
    {
    }

    public function viewAny(User $user): bool
    {
        return $this->authorization->hasPermission($user, 'permissions.manage');
    }

    public function manage(User $user): bool
    {
        return $this->authorization->hasPermission($user, 'permissions.manage');
    }
}
