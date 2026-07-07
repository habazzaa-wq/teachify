<?php

namespace App\Services\Notifications;

use App\Models\NotificationEvent;
use App\Models\Tenant;
use App\Models\TenantUser;

class NotificationEventService
{
    public function __construct(
        private readonly NotificationService $notifications,
        private readonly NotificationTemplateService $templates,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function record(Tenant $tenant, string $eventType, string $eventKey, array $payload = []): NotificationEvent
    {
        $this->bindTenant($tenant);

        $event = NotificationEvent::query()
            ->where('tenant_id', $tenant->id)
            ->where('event_type', $eventType)
            ->where('event_key', $eventKey)
            ->first();

        if ($event) {
            return $event;
        }

        $event = NotificationEvent::create([
            'tenant_id' => $tenant->id,
            'event_type' => $eventType,
            'event_key' => $eventKey,
            'payload' => $this->safePayload($payload),
            'processed_at' => null,
            'created_at' => now(),
        ])->refresh();

        $this->process($tenant, $event);

        return $event->refresh();
    }

    public function process(Tenant $tenant, NotificationEvent $event): NotificationEvent
    {
        $this->bindTenant($tenant);

        if ($event->tenant_id !== $tenant->id || $event->processed_at) {
            return $event;
        }

        $recipientId = $event->payload['tenant_user_id'] ?? null;
        $recipient = $recipientId
            ? TenantUser::query()
                ->where('tenant_id', $tenant->id)
                ->whereKey($recipientId)
                ->where('status', 'active')
                ->first()
            : null;

        if ($recipient) {
            $rendered = $this->templates->render($tenant, str_replace('.', '_', $event->event_type), 'in_app', $event->payload);

            $this->notifications->create(
                $tenant,
                $recipient,
                $event->event_type,
                $rendered['title'],
                $rendered['body'],
                $event->payload,
                $event->payload['priority'] ?? 'normal',
            );
        }

        $event->forceFill(['processed_at' => now()])->save();

        return $event->refresh();
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function safePayload(array $payload): array
    {
        return collect($payload)
            ->except(['password', 'token', 'token_hash', 'email', 'normalized_email'])
            ->all();
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
