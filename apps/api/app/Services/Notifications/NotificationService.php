<?php

namespace App\Services\Notifications;

use App\Models\Notification;
use App\Models\NotificationDelivery;
use App\Models\Tenant;
use App\Models\TenantUser;
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
            ->paginate($perPage);
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

        if (! $this->preferences->channelEnabled($tenant, $recipient, $type, 'in_app')) {
            return null;
        }

        $notification = Notification::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $recipient->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'status' => 'unread',
            'priority' => $priority,
            'data' => $this->safeData($data),
            'read_at' => null,
        ])->refresh();

        $this->dispatchDeliveryRecords($tenant, $notification, $recipient);

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

    private function dispatchDeliveryRecords(Tenant $tenant, Notification $notification, TenantUser $recipient): void
    {
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

        if ($this->preferences->channelEnabled($tenant, $recipient, $notification->type, 'email')) {
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
