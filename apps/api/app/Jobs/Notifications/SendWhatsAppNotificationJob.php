<?php

namespace App\Jobs\Notifications;

use App\Models\NotificationDelivery;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\TenantWhatsAppIntegration;
use App\Queue\Middleware\SetCorrelationContext;
use App\Queue\Middleware\SetTenantContext;
use App\Services\Integrations\WhatsApp\MetaWhatsAppCloudService;
use App\Services\Notifications\NotificationPreferenceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendWhatsAppNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 5;

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
        return [30, 120, 300, 900];
    }

    public function handle(MetaWhatsAppCloudService $whatsapp, NotificationPreferenceService $preferences): void
    {
        $delivery = NotificationDelivery::withoutGlobalScopes()
            ->with(['notification'])
            ->where('id', $this->deliveryId)
            ->where('tenant_id', $this->tenantId)
            ->first();

        if (! $delivery || $delivery->channel !== 'whatsapp') {
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

        $recipient = TenantUser::withoutGlobalScopes()->where('id', $notification->tenant_user_id)->where('tenant_id', $tenant->id)->first();
        if (! $recipient || $recipient->status !== 'active') {
            $this->mark($delivery, 'skipped', 'recipient_inactive');
            return;
        }

        if (! $preferences->channelEnabled($tenant, $recipient, $notification->type, 'whatsapp')) {
            $this->mark($delivery, 'skipped', 'opted_out');
            return;
        }

        $integration = TenantWhatsAppIntegration::withoutGlobalScopes()->where('tenant_id', $tenant->id)->first();
        if (! $integration || ! $integration->is_enabled) {
            $this->mark($delivery, 'skipped', 'integration_disabled');
            return;
        }

        $to = $recipient->phone ?? $recipient->user?->phone ?? null;
        if (! filled($to)) {
            $this->mark($delivery, 'failed', 'missing_phone', permanent: true);
            return;
        }

        try {
            $body = trim(($notification->title ? $notification->title.': ' : '').($notification->body ?? ''));
            $response = $whatsapp->sendText($tenant, (string) $to, $body, [
                'template_name' => data_get($notification->data, 'whatsapp_template_name'),
                'template_language' => data_get($notification->data, 'whatsapp_template_language'),
            ]);
            $messageId = data_get($response, 'messages.0.id');
            $delivery->forceFill([
                'status' => 'sent',
                'provider' => 'meta_whatsapp_cloud_api',
                'provider_message_id' => $messageId,
                'attempts' => (int) $delivery->attempts + 1,
                'last_attempt_at' => now(),
                'sent_at' => now(),
                'last_error' => null,
            ])->save();
        } catch (Throwable $e) {
            $permanent = $this->isPermanent($e);
            $delivery->forceFill([
                'status' => $permanent ? 'failed' : 'pending',
                'provider' => 'meta_whatsapp_cloud_api',
                'attempts' => (int) $delivery->attempts + 1,
                'last_attempt_at' => now(),
                'failed_at' => $permanent ? now() : $delivery->failed_at,
                'last_error' => mb_substr($e->getMessage(), 0, 1000),
            ])->save();

            if (! $permanent) {
                throw $e;
            }
        }
    }

    private function isPermanent(Throwable $e): bool
    {
        $msg = strtolower($e->getMessage());
        return str_contains($msg, 'not enabled')
            || str_contains($msg, 'missing_phone')
            || str_contains($msg, 'invalid parameter')
            || str_contains($msg, 'recipient')
            || str_contains($msg, 'does not exist')
            || str_contains($msg, 'template');
    }

    private function mark(NotificationDelivery $delivery, string $status, string $error, bool $permanent = false): void
    {
        $delivery->forceFill([
            'status' => $status,
            'attempts' => (int) $delivery->attempts + ($status === 'skipped' ? 0 : 1),
            'last_attempt_at' => $status === 'skipped' ? $delivery->last_attempt_at : now(),
            'failed_at' => $status === 'failed' ? now() : $delivery->failed_at,
            'last_error' => $error,
        ])->save();
    }

    public function failed(Throwable $exception): void
    {
        Log::warning('whatsapp.delivery_job_failed', [
            'tenant_id' => $this->tenantId,
            'delivery_id' => $this->deliveryId,
            'error' => $exception->getMessage(),
        ]);
    }
}
