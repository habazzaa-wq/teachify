<?php

namespace App\Policies;

use App\Models\TenantUser;
use App\Models\User;
use App\Services\Authorization\AuthorizationService;

class StudentPolicy
{
    public function __construct(private readonly AuthorizationService $authorization)
    {
    }

    public function viewEnrollments(User $user): bool
    {
        return $this->authorization->hasPermission($user, 'enrollments.view');
    }

    public function manageEnrollments(User $user): bool
    {
        return $this->authorization->hasPermission($user, 'enrollments.manage');
    }

    public function viewOwnProgress(User $user): bool
    {
        return true;
    }

    public function viewProgress(User $user, TenantUser $student): bool
    {
        if ($student->tenant_id !== currentTenant()->id) {
            return false;
        }

        $membership = currentTenantUser();

        if ($membership && $membership->id === $student->id) {
            return true;
        }

        return $this->authorization->hasPermission($user, 'enrollments.view');
    }
}
