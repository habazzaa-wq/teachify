<?php

namespace App\Jobs\Notifications;

use App\Models\NotificationDelivery;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Queue\Middleware\SetCorrelationContext;
use App\Queue\Middleware\SetTenantContext;
use App\Services\Notifications\NotificationPreferenceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendEmailNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 3;
    public int $timeout = 30;

    public function __construct(public int $deliveryId, public int $tenantId)
    {
        $this->onQueue('notifications');
    }

    public function middleware(): array
    {
        return [new SetTenantContext($this->tenantId), new SetCorrelationContext()];
    }

    public function backoff(): array
    {
        return [30, 120, 300];
    }

    public function handle(NotificationPreferenceService $preferences): void
    {
        $delivery = NotificationDelivery::withoutGlobalScopes()
            ->with(['notification'])
            ->where('id', $this->deliveryId)
            ->where('tenant_id', $this->tenantId)
            ->first();

        if (! $delivery || $delivery->channel !== 'email') {
            return;
        }
        if (in_array($delivery->status, ['delivered', 'sent', 'skipped', 'cancelled'], true)) {
            return;
        }

        $tenant = Tenant::withoutGlobalScopes()->find($this->tenantId);
        $notification = $delivery->notification;
        if (! $tenant || ! $notification) {
            $this->mark($delivery, 'skipped', 'missing_tenant_or_notification');
            return;
        }

        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);

        $recipient = TenantUser::withoutGlobalScopes()->with('user')->where('id', $notification->tenant_user_id)->where('tenant_id', $tenant->id)->first();
        if (! $recipient || $recipient->status !== 'active') {
            $this->mark($delivery, 'skipped', 'recipient_inactive');
            return;
        }

        if (! $preferences->channelEnabled($tenant, $recipient, $notification->type, 'email')) {
            $this->mark($delivery, 'skipped', 'opted_out');
            return;
        }

        $email = $recipient->user?->email;
        if (! filled($email) || str_ends_with((string) $email, '.local')) {
            $this->mark($delivery, 'skipped', 'missing_or_internal_email');
            return;
        }

        try {
            $mailer = $this->resolveMailer($tenant);
            $fromAddress = data_get($tenant->settings_json, 'mail.from_address') ?: config('mail.from.address');
            $fromName = data_get($tenant->settings_json, 'mail.from_name') ?: ($tenant->name ?: config('mail.from.name'));
            $subject = $notification->title ?: 'إشعار جديد';
            $body = $notification->body ?: '';
            $html = $this->renderHtml($tenant, $subject, $body);

            Mail::mailer($mailer)->html($html, function ($message) use ($email, $subject, $fromAddress, $fromName) {
                $message->to($email)->subject($subject);
                if ($fromAddress) {
                    $message->from($fromAddress, $fromName ?: null);
                }
            });

            $delivery->forceFill([
                'status' => 'sent',
                'provider' => $mailer,
                'attempts' => (int) $delivery->attempts + 1,
                'last_attempt_at' => now(),
                'sent_at' => now(),
                'last_error' => null,
            ])->save();
        } catch (Throwable $e) {
            $delivery->forceFill([
                'status' => 'pending',
                'attempts' => (int) $delivery->attempts + 1,
                'last_attempt_at' => now(),
                'last_error' => mb_substr($e->getMessage(), 0, 1000),
            ])->save();
            throw $e;
        }
    }

    private function resolveMailer(Tenant $tenant): string
    {
        $mail = (array) data_get($tenant->settings_json, 'mail', []);
        $enabled = !empty($mail['is_enabled']);
        $host = $mail['host'] ?? null;
        if (! $enabled || ! filled($host)) {
            return config('mail.default', 'log');
        }

        $password = null;
        if (!empty($mail['password_encrypted'])) {
            try { $password = Crypt::decryptString($mail['password_encrypted']); } catch (Throwable) { $password = null; }
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

    private function renderHtml(Tenant $tenant, string $subject, string $body): string
    {
        $safeSubject = e($subject);
        $safeBody = nl2br(e($body));
        $tenantName = e($tenant->name ?? 'المنصة');
        return "<div dir='rtl' style='font-family:Arial,sans-serif;background:#f6f7fb;padding:24px'><div style='max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e5e7eb'><h2 style='margin:0 0 12px;color:#111827;font-size:20px'>{$safeSubject}</h2><p style='margin:0 0 16px;color:#374151;line-height:1.8'>{$safeBody}</p><hr style='border:none;border-top:1px solid #e5e7eb;margin:16px 0'><p style='margin:0;color:#6b7280;font-size:12px'>{$tenantName}</p></div></div>";
    }

    private function mark(NotificationDelivery $delivery, string $status, string $error): void
    {
        $delivery->forceFill([
            'status' => $status,
            'last_attempt_at' => now(),
            'last_error' => $error,
            'failed_at' => $status === 'failed' ? now() : $delivery->failed_at,
        ])->save();
    }

    public function failed(Throwable $exception): void
    {
        Log::warning('email.delivery_job_failed', [
            'tenant_id' => $this->tenantId,
            'delivery_id' => $this->deliveryId,
            'error' => $exception->getMessage(),
        ]);
    }
}
