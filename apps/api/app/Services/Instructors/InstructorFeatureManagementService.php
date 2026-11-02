<?php

namespace App\Services\Instructors;

use App\Models\Course;
use App\Models\CourseInstructor;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

class InstructorFeatureManagementService
{
    public function disable(Tenant $tenant, string $mode): void
    {
        DB::transaction(function () use ($tenant, $mode): void {
            if ($mode === 'purge') {
                $memberships = TenantUser::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('is_instructor', true)
                    ->lockForUpdate()
                    ->get();
                $membershipIds = $memberships->modelKeys();
                $userIds = $memberships->pluck('user_id')->all();

                if ($membershipIds !== []) {
                    CourseInstructor::query()
                        ->where('tenant_id', $tenant->id)
                        ->whereIn('tenant_user_id', $membershipIds)
                        ->delete();

                    Course::query()
                        ->where('tenant_id', $tenant->id)
                        ->where(function ($query) use ($membershipIds): void {
                            $query->whereIn('primary_instructor_tenant_user_id', $membershipIds)
                                ->orWhere('instructor_assignment_managed', true);
                        })
                        ->update([
                            'primary_instructor_tenant_user_id' => null,
                            'instructor_assignment_managed' => false,
                        ]);

                    $instructorRoleId = Role::query()
                        ->where('tenant_id', $tenant->id)
                        ->where('slug', 'instructor')
                        ->value('id');

                    foreach ($memberships as $membership) {
                        if ($instructorRoleId) {
                            $membership->roles()->detach($instructorRoleId);
                        }
                        $membership->forceFill([
                            'is_instructor' => false,
                            'must_change_password' => false,
                            'avatar' => null,
                            'job_title' => null,
                            'department' => null,
                        ])->save();
                    }

                    if ($userIds !== []) {
                        PersonalAccessToken::query()
                            ->where('tokenable_type', (new User())->getMorphClass())
                            ->whereIn('tokenable_id', $userIds)
                            ->whereIn('name', ['instructor_access_token', 'instructor_refresh_token'])
                            ->delete();
                    }
                }
            }

            $flags = $tenant->feature_flags ?? [];
            $flags['has_instructors'] = false;
            $tenant->forceFill(['feature_flags' => $flags])->save();
        });
    }
}
