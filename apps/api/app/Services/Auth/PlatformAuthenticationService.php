<?php

namespace App\Services\Auth;

use App\Models\PlatformAdmin;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\NewAccessToken;

class PlatformAuthenticationService
{
    private const TOKEN_NAME = 'platform-admin';

    /**
     * Authenticate a platform super admin and issue a Sanctum token.
     *
     * @return array{user: User, platform_admin: PlatformAdmin, token: NewAccessToken}
     */
    public function login(string $email, string $password): array
    {
        $user = User::query()
            ->where('email', mb_strtolower(trim($email)))
            ->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        $platformAdmin = $user->platformAdmin()
            ->where('status', 'active')
            ->first();

        if (! $platformAdmin) {
            throw ValidationException::withMessages([
                'email' => ['Platform authorization required.'],
            ]);
        }

        $user->tokens()
            ->where('name', self::TOKEN_NAME)
            ->delete();

        $token = $user->createToken(self::TOKEN_NAME, ['platform:access']);

        return [
            'user' => $user,
            'platform_admin' => $platformAdmin,
            'token' => $token,
        ];
    }

    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();

        if ($token !== null) {
            $token->delete();

            return;
        }

        $user->tokens()
            ->where('name', self::TOKEN_NAME)
            ->delete();
    }
}
