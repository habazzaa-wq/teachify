<?php

namespace App\Services\Instructors;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class InstructorMembershipGuard
{
    public function hasInstructorMembership(User $user): bool
    {
        return TenantUser::withTrashed()
            ->where('user_id', $user->id)
            ->where('is_instructor', true)
            ->exists();
    }

    public function assertNotInstructorIdentity(User $user): void
    {
        if ($this->hasInstructorMembership($user)) {
            throw ValidationException::withMessages([
                'email' => ['Use the instructor account management flow for this identity.'],
            ]);
        }
    }

    public function assertCanProvision(User $user): void
    {
        if ($user->isPlatformSuperAdmin() || TenantUser::withTrashed()->where('user_id', $user->id)->exists()) {
            throw ValidationException::withMessages([
                'email' => ['This account already has a platform or tenant identity and cannot be provisioned as an instructor.'],
            ]);
        }
    }

    public function assertNotInstructorInAnotherTenant(User $user, Tenant $tenant): void
    {
        if (TenantUser::withTrashed()
            ->where('user_id', $user->id)
            ->where('is_instructor', true)
            ->where('tenant_id', '!=', $tenant->id)
            ->exists()) {
            throw ValidationException::withMessages([
                'email' => ['An instructor account cannot be added to another tenant.'],
            ]);
        }
    }
}
