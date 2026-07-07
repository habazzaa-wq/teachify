<?php

namespace App\Services\Auth;

use App\Events\Auth\PasswordResetCompleted;
use App\Models\TenantUser;
use App\Services\Notifications\NotificationEventService;
use App\Services\Security\AuditLogger;
use App\Services\Support\EmailNormalizer;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PasswordResetService
{
    public function __construct(
        private readonly EmailNormalizer $emails,
        private readonly SessionInvalidationService $sessions,
        private readonly AuditLogger $audit,
        private readonly NotificationEventService $notificationEvents,
    ) {
    }

    public function sendResetLink(string $email): void
    {
        Password::sendResetLink([
            'email' => $this->emails->normalize($email),
        ]);

        $this->audit->record('password_reset_requested');
    }

    public function reset(string $email, string $token, string $password): string
    {
        return Password::reset(
            [
                'email' => $this->emails->normalize($email),
                'token' => $token,
                'password' => $password,
                'password_confirmation' => $password,
            ],
            function ($user) use ($password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $this->sessions->invalidateForUser($user);

                event(new PasswordReset($user));
                event(new PasswordResetCompleted($user->id));
                TenantUser::query()
                    ->with('tenant')
                    ->where('user_id', $user->id)
                    ->where('status', 'active')
                    ->each(function (TenantUser $membership) use ($user): void {
                        $this->notificationEvents->record($membership->tenant, 'password.reset.completed', 'password-reset-'.$user->id.'-'.$membership->tenant_id.'-'.now()->timestamp, [
                            'tenant_user_id' => $membership->id,
                            'user_id' => $user->id,
                        ]);
                    });
                $this->audit->record('password_reset_completed', ['user_id' => $user->id]);
            },
        );
    }
}
