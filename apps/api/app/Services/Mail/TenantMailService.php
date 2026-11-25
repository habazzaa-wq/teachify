<?php

namespace App\Services\Mail;

use App\Models\Tenant;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Mail;
use Throwable;

class TenantMailService
{
    /**
     * Send HTML mail through the tenant's own SMTP settings when configured.
     * Falls back to the application's default mailer (log in local/staging).
     */
    public function sendHtml(
        Tenant $tenant,
        string $to,
        string $subject,
        string $html,
        ?string $fromAddress = null,
        ?string $fromName = null,
    ): void {
        $mailer = $this->resolveMailer($tenant);
        $fromAddress ??= data_get($tenant->settings_json, 'mail.from_address') ?: config('mail.from.address');
        $fromName ??= data_get($tenant->settings_json, 'mail.from_name') ?: ($tenant->name ?: config('mail.from.name'));

        Mail::mailer($mailer)->html($html, function ($message) use ($to, $subject, $fromAddress, $fromName) {
            $message->to($to)->subject($subject);
            if ($fromAddress) {
                $message->from($fromAddress, $fromName ?: null);
            }
        });
    }

    /**
     * Connect and authenticate to the tenant SMTP server without sending mail.
     * Used by the settings "test" action so a bad password is detected early.
     */
    public function verifyTransport(Tenant $tenant): void
    {
        $transport = Mail::mailer($this->resolveMailer($tenant))->getSymfonyTransport();

        if (! method_exists($transport, 'start')) {
            return;
        }

        $transport->start();

        if (method_exists($transport, 'stop')) {
            $transport->stop();
        }
    }

    public function resolveMailer(Tenant $tenant): string
    {
        $mail = (array) data_get($tenant->settings_json, 'mail', []);
        $enabled = ! empty($mail['is_enabled']);
        $host = $mail['host'] ?? null;

        if (! $enabled || ! filled($host)) {
            return config('mail.default', 'log');
        }

        $password = null;
        if (! empty($mail['password_encrypted'])) {
            try {
                $password = Crypt::decryptString($mail['password_encrypted']);
            } catch (Throwable) {
                $password = null;
            }
        }

        $name = 'tenant_mail_'.$tenant->id;
        config(["mail.mailers.$name" => [
            'transport' => $mail['mailer'] ?? 'smtp',
            'host' => $mail['host'] ?? '',
            'port' => (int) ($mail['port'] ?? 587),
            'encryption' => ($mail['encryption'] ?? 'tls') === 'null' ? null : ($mail['encryption'] ?? 'tls'),
            'username' => $mail['username'] ?? null,
            'password' => $password,
            'timeout' => null,
        ]]);

        return $name;
    }
}
