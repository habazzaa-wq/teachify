<?php

namespace App\Services\Auth;

use App\Events\Auth\LoginFailed;
use App\Events\Auth\LoginSucceeded;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Security\AuditLogger;
use App\Services\Support\EmailNormalizer;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\NewAccessToken;

class AuthenticationService
{
    public function __construct(
        private readonly EmailNormalizer $emails,
        private readonly TenantMembershipService $memberships,
        private readonly AuditLogger $audit,
    ) {
    }

    /**
     * @return array{user: User, membership: TenantUser, access_token: NewAccessToken, refresh_token: NewAccessToken}
     *
     * @throws ValidationException
     */
    public function login(Tenant $tenant, string $identifier, string $password): array
    {
        $identifier = trim($identifier);

        $user = $this->findUserByIdentifier($tenant, $identifier);

        if (! $user || ! Hash::check($password, $user->password)) {
            event(new LoginFailed($tenant->id, $identifier));
            $this->audit->record('login_failed', ['tenant_id' => $tenant->id, 'identifier' => $identifier]);
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $membership = $this->memberships->activeMembership($user, $tenant);

        if (! $membership) {
            event(new LoginFailed($tenant->id, $identifier, $user->id));
            $this->audit->record('login_rejected_membership', ['tenant_id' => $tenant->id, 'user_id' => $user->id]);
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Revoke existing tokens for this tenant session
        $user->tokens()
            ->where('name', 'access_token')
            ->orWhere('name', 'refresh_token')
            ->delete();

        $accessToken = $user->createToken('access_token', ['access:api'], now()->addHours(24));
        $refreshToken = $user->createToken('refresh_token', ['refresh:token'], now()->addDays(30));

        Auth::login($user);
        if (request()->hasSession()) {
            request()->session()->regenerate();
        }
        $this->memberships->touchLastAccessed($membership);

        event(new LoginSucceeded($tenant->id, $user->id));
        $this->audit->record('login_succeeded', ['tenant_id' => $tenant->id, 'user_id' => $user->id]);

        return [
            'user' => $user,
            'membership' => $membership->refresh(),
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
        ];
    }

    /**
     * Resolve the user by email or phone number.
     *
     * Phone numbers are matched against the tenant-scoped membership first
     * (public student registrations store the phone on tenant_users), then
     * fall back to the global user record.
     */
    private function findUserByIdentifier(Tenant $tenant, string $identifier): ?User
    {
        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            $normalizedEmail = $this->emails->normalize($identifier);

            return User::query()->where('email', $normalizedEmail)->first();
        }

        $membership = TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('phone', $identifier)
            ->first();

        if ($membership) {
            return $membership->user;
        }

        return User::query()->where('phone', $identifier)->first();
    }

    /**
     * @return array{user: User, membership: TenantUser, access_token: NewAccessToken}
     *
     * @throws ValidationException
     */
    public function refresh(User $user, Tenant $tenant): array
    {
        $membership = $this->memberships->activeMembership($user, $tenant);

        if (! $membership) {
            throw ValidationException::withMessages([
                'email' => ['No active membership found.'],
            ]);
        }

        // Revoke old access tokens, keep refresh tokens
        $user->tokens()
            ->where('name', 'access_token')
            ->delete();

        $accessToken = $user->createToken('access_token', ['access:api'], now()->addHours(24));
        $this->memberships->touchLastAccessed($membership);

        return [
            'user' => $user,
            'membership' => $membership->refresh(),
            'access_token' => $accessToken,
        ];
    }

    public function logout(?User $user = null): void
    {
        if ($user) {
            $user->tokens()->delete();
        }

        Auth::guard('web')->logout();
        if (request()->hasSession()) {
            request()->session()->invalidate();
            request()->session()->regenerateToken();
        }
    }
}
