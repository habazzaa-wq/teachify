<?php

namespace App\Services\Notifications;

use App\Models\Notification;
use App\Models\NotificationDelivery;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Support\Pagination;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class NotificationService
{
    public function __construct(private readonly NotificationPreferenceService $preferences)
    {
    }

    /**
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function list(
        Tenant $tenant,
        TenantUser $recipient,
        bool $unreadOnly = false,
        ?string $typePrefix = null,
        int $perPage = 25,
    ): \Illuminate\Contracts\Pagination\LengthAwarePaginator {
        return Notification::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $recipient->id)
            ->when($unreadOnly, fn ($query) => $query->where('status', 'unread'))
            ->when($typePrefix, fn ($query) => $query->where('type', 'like', $typePrefix . '%'))
            ->orderByDesc('created_at')
            ->paginate(Pagination::perPage($perPage));
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(
        Tenant $tenant,
        TenantUser $recipient,
        string $type,
        string $title,
        string $body,
        array $data = [],
        string $priority = 'normal',
    ): ?Notification {
        $this->bindTenant($tenant);
        $this->ensureRecipientInTenant($tenant, $recipient);
        $this->ensurePriority($priority);

        $inAppEnabled = $this->preferences->channelEnabled($tenant, $recipient, $type, 'in_app');
        $emailEnabled = $this->preferences->channelEnabled($tenant, $recipient, $type, 'email');
        $whatsappEnabled = $this->preferences->channelEnabled($tenant, $recipient, $type, 'whatsapp');

        if (! $inAppEnabled && ! $emailEnabled && ! $whatsappEnabled) {
            return null;
        }

        $notification = Notification::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $recipient->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'status' => $inAppEnabled ? 'unread' : 'archived',
            'priority' => $priority,
            'data' => $this->safeData($data),
            'read_at' => $inAppEnabled ? null : now(),
        ])->refresh();

        $this->dispatchDeliveryRecords($tenant, $notification, $recipient, $inAppEnabled, $emailEnabled, $whatsappEnabled);

        return $notification->load('deliveries');
    }

    public function markRead(Tenant $tenant, Notification $notification): Notification
    {
        $this->bindTenant($tenant);
        $this->ensureNotificationInTenant($tenant, $notification);

        $notification->forceFill([
            'status' => 'read',
            'read_at' => $notification->read_at ?? now(),
        ])->save();

        return $notification->refresh();
    }

    public function archive(Tenant $tenant, Notification $notification): Notification
    {
        $this->bindTenant($tenant);
        $this->ensureNotificationInTenant($tenant, $notification);

        $notification->forceFill(['status' => 'archived'])->save();

        return $notification->refresh();
    }

    private function dispatchDeliveryRecords(
        Tenant $tenant,
        Notification $notification,
        TenantUser $recipient,
        bool $inAppEnabled,
        bool $emailEnabled,
        bool $whatsappEnabled,
    ): void
    {
        if ($inAppEnabled) {
            NotificationDelivery::create([
                'tenant_id' => $tenant->id,
                'notification_id' => $notification->id,
                'channel' => 'in_app',
                'status' => 'delivered',
                'attempts' => 1,
                'last_attempt_at' => now(),
                'delivered_at' => now(),
                'last_error' => null,
            ]);
        }

        if ($emailEnabled) {
            NotificationDelivery::create([
                'tenant_id' => $tenant->id,
                'notification_id' => $notification->id,
                'channel' => 'email',
                'status' => 'pending',
                'attempts' => 0,
                'last_attempt_at' => null,
                'delivered_at' => null,
                'last_error' => null,
            ]);
        }

        if ($whatsappEnabled) {
            $dedupe = 'whatsapp:notification:'.$notification->id.':recipient:'.$recipient->id;
            $delivery = NotificationDelivery::query()->firstOrCreate(
                ['tenant_id' => $tenant->id, 'dedupe_key' => $dedupe],
                [
                    'notification_id' => $notification->id,
                    'channel' => 'whatsapp',
                    'provider' => 'meta_whatsapp_cloud_api',
                    'status' => 'pending',
                    'attempts' => 0,
                    'last_attempt_at' => null,
                    'delivered_at' => null,
                    'last_error' => null,
                ]
            );

            \Illuminate\Support\Facades\DB::afterCommit(function () use ($delivery, $tenant) {
                \App\Jobs\Notifications\SendWhatsAppNotificationJob::dispatch($delivery->id, $tenant->id)->onQueue('notifications');
            });
        }
    }

    private function ensureRecipientInTenant(Tenant $tenant, TenantUser $recipient): void
    {
        if ($recipient->tenant_id !== $tenant->id || $recipient->status !== 'active') {
            throw ValidationException::withMessages([
                'tenant_user_id' => ['The notification recipient is invalid for this tenant.'],
            ]);
        }
    }

    private function ensureNotificationInTenant(Tenant $tenant, Notification $notification): void
    {
        if ($notification->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'notification' => ['The notification is invalid for this tenant.'],
            ]);
        }
    }

    private function ensurePriority(string $priority): void
    {
        if (! in_array($priority, ['low', 'normal', 'high', 'critical'], true)) {
            throw ValidationException::withMessages([
                'priority' => ['The selected notification priority is invalid.'],
            ]);
        }
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function safeData(array $data): array
    {
        return collect($data)
            ->except(['password', 'token', 'token_hash', 'email', 'normalized_email'])
            ->all();
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}


