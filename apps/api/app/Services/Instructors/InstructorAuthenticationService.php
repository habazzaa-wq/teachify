<?php

namespace App\Services\Instructors;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Security\AuditLogger;
use App\Services\Support\EmailNormalizer;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\NewAccessToken;
use Laravel\Sanctum\PersonalAccessToken;

class InstructorAuthenticationService
{
    public function __construct(
        private readonly InstructorFeature $feature,
        private readonly EmailNormalizer $emails,
        private readonly AuditLogger $audit,
    ) {}

    /**
     * @return array{user: User, membership: TenantUser, access_token: NewAccessToken, refresh_token: ?NewAccessToken}
     */
    public function login(Tenant $tenant, string $email, string $password): array
    {
        $this->feature->ensureEnabled($tenant);
        $user = User::query()->where('email', $this->emails->normalize($email))->first();
        $membership = $user
            ? TenantUser::query()
                ->where('tenant_id', $tenant->id)
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->where('is_instructor', true)
                ->with('roles')
                ->first()
            : null;

        if (! $user || ! $membership || ! Hash::check($password, $user->password) || ! $this->hasOnlyInstructorRole($membership)) {
            $this->audit->record('instructor_login_failed', [
                'tenant_id' => $tenant->id,
                'email' => $this->emails->normalize($email),
            ]);
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $accessAbility = $membership->must_change_password
            ? 'instructor:password-change'
            : 'instructor:access';
        $accessToken = $user->createToken(
            'instructor_access_token',
            [$accessAbility, $this->tenantAbility($tenant)],
            now()->addMinutes($membership->must_change_password ? 30 : 1440),
        );
        $refreshToken = $membership->must_change_password
            ? null
            : $user->createToken(
                'instructor_refresh_token',
                ['instructor:refresh', $this->tenantAbility($tenant)],
                now()->addDays(30),
            );

        $this->audit->record('instructor_login_succeeded', [
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $membership->id,
            'user_id' => $user->id,
        ]);

        return [
            'user' => $user,
            'membership' => $membership,
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
        ];
    }

    /**
     * @return array{access_token: NewAccessToken, refresh_token: NewAccessToken}
     */
    public function changePassword(User $user, TenantUser $membership, string $password): array
    {
        $user->forceFill(['password' => $password])->save();
        $membership->forceFill(['must_change_password' => false])->save();
        $user->tokens()->delete();

        $tenantAbility = 'instructor:tenant:'.$membership->tenant_id;
        $accessToken = $user->createToken(
            'instructor_access_token',
            ['instructor:access', $tenantAbility],
            now()->addDay(),
        );
        $refreshToken = $user->createToken(
            'instructor_refresh_token',
            ['instructor:refresh', $tenantAbility],
            now()->addDays(30),
        );

        $this->audit->record('instructor_password_changed', [
            'tenant_id' => $membership->tenant_id,
            'tenant_user_id' => $membership->id,
            'user_id' => $user->id,
        ]);

        return ['access_token' => $accessToken, 'refresh_token' => $refreshToken];
    }

    /**
     * @return array{access_token: NewAccessToken}
     */
    public function refresh(Tenant $tenant, string $plainTextToken): array
    {
        $this->feature->ensureEnabled($tenant);
        $token = PersonalAccessToken::findToken($plainTextToken);

        if (! $token || $token->name !== 'instructor_refresh_token'
            || ! $token->expires_at
            || $token->expires_at->isPast()
            || ! in_array('instructor:refresh', $token->abilities, true)
            || ! in_array($this->tenantAbility($tenant), $token->abilities, true)) {
            throw new AuthenticationException('Invalid refresh token.');
        }

        $user = $token->tokenable;
        $membership = $user instanceof User
            ? TenantUser::query()
                ->where('tenant_id', $tenant->id)
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->where('is_instructor', true)
                ->with('roles')
                ->first()
            : null;

        if (! $user instanceof User || ! $membership || $membership->must_change_password
            || ! $this->hasOnlyInstructorRole($membership)) {
            throw new AuthenticationException('Invalid refresh token.');
        }

        return [
            'access_token' => $user->createToken(
                'instructor_access_token',
                ['instructor:access', $this->tenantAbility($tenant)],
                now()->addDay(),
            ),
        ];
    }

    public function revokeCurrentToken(User $user): void
    {
        $token = $user->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }
    }

    private function hasOnlyInstructorRole(TenantUser $membership): bool
    {
        return $membership->roles->count() === 1
            && $membership->roles->first()?->slug === 'instructor';
    }

    private function tenantAbility(Tenant $tenant): string
    {
        return 'instructor:tenant:'.$tenant->id;
    }
}
