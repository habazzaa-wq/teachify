<?php

namespace App\Services\Auth;

use App\Events\Auth\InvitationAccepted;
use App\Events\Auth\InvitationCreated;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Security\AuditLogger;
use App\Services\Support\EmailNormalizer;
use App\Services\Notifications\NotificationEventService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class InvitationService
{
    public function __construct(
        private readonly EmailNormalizer $emails,
        private readonly AuditLogger $audit,
        private readonly NotificationEventService $notificationEvents,
    ) {
    }

    /**
     * @param  list<int>  $roleIds
     * @return array{invitation: TenantInvitation, token: string}
     *
     * @throws ValidationException
     */
    public function create(Tenant $tenant, string $email, array $roleIds, ?User $inviter = null): array
    {
        $normalizedEmail = $this->emails->normalize($email);
        $roles = $this->rolesForTenant($tenant, $roleIds);

        if ($roles->count() !== count(array_unique($roleIds))) {
            throw ValidationException::withMessages([
                'role_ids' => ['One or more roles are invalid for this tenant.'],
            ]);
        }

        if ($this->hasPendingInvitation($tenant, $normalizedEmail)) {
            throw ValidationException::withMessages([
                'email' => ['A pending invitation already exists for this email.'],
            ]);
        }

        $token = Str::random(64);
        $invitation = TenantInvitation::create([
            'tenant_id' => $tenant->id,
            'email' => trim($email),
            'normalized_email' => $normalizedEmail,
            'token_hash' => hash('sha256', $token),
            'status' => 'pending',
            'invited_by_user_id' => $inviter?->id,
            'expires_at' => now()->addDays(7),
        ]);

        $invitation->roles()->sync(
            $roles->mapWithKeys(fn (Role $role) => [$role->id => ['tenant_id' => $tenant->id]])->all(),
        );

        event(new InvitationCreated($invitation->id, $tenant->id, $normalizedEmail));
        $this->notificationEvents->record($tenant, 'invitation.created', 'invitation-created-'.$invitation->id, [
            'invitation_id' => $invitation->id,
            'invited_by_user_id' => $inviter?->id,
        ]);
        $this->audit->record('invitation_created', [
            'tenant_id' => $tenant->id,
            'invitation_id' => $invitation->id,
            'email' => $normalizedEmail,
        ]);

        return ['invitation' => $invitation->refresh(), 'token' => $token];
    }

    /**
     * @throws ValidationException
     */
    public function accept(
        Tenant $tenant,
        string $token,
        ?string $name = null,
        ?string $password = null,
        ?User $authenticatedUser = null,
    ): TenantUser {
        $invitation = TenantInvitation::query()
            ->where('tenant_id', $tenant->id)
            ->where('token_hash', hash('sha256', $token))
            ->first();

        if (! $invitation || $invitation->status !== 'pending') {
            throw ValidationException::withMessages(['token' => ['This invitation is invalid.']]);
        }

        if ($invitation->expires_at->isPast()) {
            $invitation->forceFill(['status' => 'expired'])->save();
            throw ValidationException::withMessages(['token' => ['This invitation is invalid.']]);
        }

        $user = $authenticatedUser ?? User::query()
            ->where('email', $invitation->normalized_email)
            ->first();

        if ($user) {
            if ($user->email !== $invitation->normalized_email) {
                throw ValidationException::withMessages(['token' => ['This invitation is invalid.']]);
            }

            if (! $authenticatedUser && (! $password || ! Hash::check($password, $user->password))) {
                throw ValidationException::withMessages(['password' => ['The provided credentials are incorrect.']]);
            }
        } else {
            if (! $name || ! $password) {
                throw ValidationException::withMessages([
                    'name' => ['The name field is required.'],
                    'password' => ['The password field is required.'],
                ]);
            }

            $user = User::create([
                'name' => $name,
                'email' => $invitation->normalized_email,
                'password' => $password,
            ]);
        }

        $membership = TenantUser::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
            ],
            [
                'status' => 'active',
                'joined_at' => now(),
            ],
        );

        $membership->roles()->sync(
            $invitation->roles
                ->mapWithKeys(fn (Role $role) => [$role->id => ['tenant_id' => $tenant->id]])
                ->all(),
        );

        $invitation->forceFill([
            'status' => 'accepted',
            'accepted_by_user_id' => $user->id,
            'accepted_at' => now(),
        ])->save();

        event(new InvitationAccepted($invitation->id, $tenant->id, $user->id));
        $this->notificationEvents->record($tenant, 'invitation.accepted', 'invitation-accepted-'.$invitation->id, [
            'tenant_user_id' => $membership->id,
            'invitation_id' => $invitation->id,
        ]);
        $this->audit->record('invitation_accepted', [
            'tenant_id' => $tenant->id,
            'invitation_id' => $invitation->id,
            'user_id' => $user->id,
        ]);

        return $membership->refresh();
    }

    private function hasPendingInvitation(Tenant $tenant, string $normalizedEmail): bool
    {
        return TenantInvitation::query()
            ->where('tenant_id', $tenant->id)
            ->where('normalized_email', $normalizedEmail)
            ->where('status', 'pending')
            ->exists();
    }

    /**
     * @param  list<int>  $roleIds
     * @return Collection<int, Role>
     */
    private function rolesForTenant(Tenant $tenant, array $roleIds): Collection
    {
        return Role::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', array_unique($roleIds))
            ->get();
    }
}
