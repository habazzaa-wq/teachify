<?php

namespace App\Services\Instructors;

use App\Models\Course;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Security\AuditLogger;
use App\Services\Support\EmailNormalizer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InstructorAccountService
{
    public function __construct(
        private readonly InstructorFeature         $feature,
        private readonly InstructorMembershipGuard $memberships,
        private readonly EmailNormalizer           $emails,
        private readonly AuditLogger               $audit,
    )
    {
    }

    /**
     * @return array{membership: TenantUser, temporary_password: string}
     */
    public function create(Tenant $tenant, string $name, string $email): array
    {
        $this->feature->ensureEnabled($tenant);
        $email = $this->emails->normalize($email);
        $temporaryPassword = Str::password(20);

        return DB::transaction(function () use ($tenant, $name, $email, $temporaryPassword): array {
            $user = User::query()->where('email', $email)->lockForUpdate()->first();

            if ($user) {
                $this->memberships->assertCanProvision($user);
                $user->forceFill([
                    'name' => $name,
                    'password' => $temporaryPassword,
                ])->save();
            } else {
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => $temporaryPassword,
                ]);
            }
            $user->tokens()->delete();

            $instructorRole = Role::query()
                ->where('tenant_id', $tenant->id)
                ->where('slug', 'instructor')
                ->firstOrFail();

            $membership = TenantUser::create([
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'status' => 'active',
                'is_instructor' => true,
                'must_change_password' => true,
                'joined_at' => now(),
            ]);
            $membership->roles()->sync([$instructorRole->id => ['tenant_id' => $tenant->id]]);

            $this->audit->record('instructor_created', [
                'tenant_id' => $tenant->id,
                'tenant_user_id' => $membership->id,
                'user_id' => $user->id,
            ]);

            return [
                'membership' => $membership->load(['user', 'roles']),
                'temporary_password' => $temporaryPassword,
            ];
        });
    }

    /**
     * @return list<array{id: int, name: string, email: string, avatar: ?string, status: string, courses: list<array{id: int, title: string, status: string}>}>
     */
    public function list(Tenant $tenant): array
    {
        $this->feature->ensureEnabled($tenant);

        $memberships = TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('is_instructor', true)
            ->with('user:id,name,email,avatar')
            ->orderBy('id')
            ->get();
        $membershipIds = $memberships->modelKeys();
        $coursesByInstructor = [];

        if ($membershipIds !== []) {
            $courses = Course::query()
                ->where('tenant_id', $tenant->id)
                ->where(function ($query) use ($membershipIds): void {
                    $query->whereIn('primary_instructor_tenant_user_id', $membershipIds)
                        ->orWhereHas('instructors', fn($assignments) => $assignments->whereIn('tenant_user_id', $membershipIds));
                })
                ->with(['instructors:id,tenant_id,course_id,tenant_user_id'])
                ->get(['id', 'tenant_id', 'title', 'status', 'primary_instructor_tenant_user_id']);

            foreach ($courses as $course) {
                $assignedIds = $course->instructors
                    ->pluck('tenant_user_id')
                    ->push($course->primary_instructor_tenant_user_id)
                    ->filter()
                    ->unique();

                foreach ($assignedIds as $membershipId) {
                    $coursesByInstructor[$membershipId][] = [
                        'id' => $course->id,
                        'title' => $course->title,
                        'status' => $course->status,
                    ];
                }
            }
        }

        return $memberships
            ->map(fn(TenantUser $membership): array => [
                'id' => $membership->id,
                'name' => $membership->user->name,
                'email' => $membership->user->email,
                'avatar' => $membership->avatar ?? $membership->user->avatar,
                'status' => $membership->status,
                'courses' => $coursesByInstructor[$membership->id] ?? [],
            ])
            ->all();
    }

    /**
     * @return list<array{id: int, name: string, avatar: ?string, status: string}>
     */
    public function options(Tenant $tenant): array
    {
        $this->feature->ensureEnabled($tenant);

        return TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('is_instructor', true)
            ->where('status', 'active')
            ->with('user:id,name,avatar')
            ->orderBy('id')
            ->get()
            ->map(fn(TenantUser $membership): array => [
                'id' => $membership->id,
                'name' => $membership->user->name,
                'avatar' => $membership->avatar ?? $membership->user->avatar,
                'status' => $membership->status,
            ])
            ->all();
    }

    public function updateStatus(Tenant $tenant, int $membershipId, string $status): TenantUser
    {
        $this->feature->ensureEnabled($tenant);
        $membership = $this->findMembership($tenant, $membershipId);
        $membership->forceFill(['status' => $status])->save();

        if ($status !== 'active') {
            $membership->user()->firstOrFail()->tokens()->delete();
        }

        $this->audit->record('instructor_status_updated', [
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $membership->id,
            'status' => $status,
        ]);

        return $membership->load('user');
    }

    /**
     * @return array{membership: TenantUser, temporary_password: string}
     */
    public function resetPassword(Tenant $tenant, int $membershipId): array
    {
        $this->feature->ensureEnabled($tenant);
        $membership = $this->findMembership($tenant, $membershipId);
        $temporaryPassword = Str::password(20);
        $user = $membership->user()->firstOrFail();

        DB::transaction(function () use ($membership, $temporaryPassword, $user): void {
            $user->forceFill(['password' => $temporaryPassword])->save();
            $user->tokens()->delete();
            $membership->forceFill(['must_change_password' => true])->save();
        });

        $this->audit->record('instructor_password_reset', [
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $membership->id,
            'user_id' => $user->id,
        ]);

        return [
            'membership' => $membership->load('user'),
            'temporary_password' => $temporaryPassword,
        ];
    }

    private function findMembership(Tenant $tenant, int $membershipId): TenantUser
    {
        return TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('is_instructor', true)
            ->whereKey($membershipId)
            ->firstOrFail();
    }
}
