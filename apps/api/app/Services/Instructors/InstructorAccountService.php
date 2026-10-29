<?php

namespace App\Services\Instructors;

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
        private readonly InstructorFeature $feature,
        private readonly InstructorMembershipGuard $memberships,
        private readonly EmailNormalizer $emails,
        private readonly AuditLogger $audit,
    ) {}

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
     * @return list<array{id: int, name: string, email: string, avatar: ?string, status: string}>
     */
    public function list(Tenant $tenant): array
    {
        $this->feature->ensureEnabled($tenant);

        return TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('is_instructor', true)
            ->where('status', 'active')
            ->with('user:id,name,email,avatar')
            ->orderBy('id')
            ->get()
            ->map(fn (TenantUser $membership): array => [
                'id' => $membership->id,
                'name' => $membership->user->name,
                'email' => $membership->user->email,
                'avatar' => $membership->avatar ?? $membership->user->avatar,
                'status' => $membership->status,
            ])
            ->all();
    }
}
