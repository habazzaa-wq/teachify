<?php

namespace App\Services\Notifications;

use App\Models\NotificationPreference;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class NotificationPreferenceService
{
    /**
     * @return Collection<int, NotificationPreference>
     */
    public function list(Tenant $tenant, TenantUser $owner): Collection
    {
        $this->ensureOwnerInTenant($tenant, $owner);

        return NotificationPreference::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $owner->id)
            ->orderBy('notification_type')
            ->get();
    }

    /**
     * @param list<array{notification_type:string,in_app_enabled?:bool,email_enabled?:bool,whatsapp_enabled?:bool}> $preferences
     * @return Collection<int, NotificationPreference>
     */
    public function updateMany(Tenant $tenant, TenantUser $owner, array $preferences): Collection
    {
        $this->bindTenant($tenant);
        $this->ensureOwnerInTenant($tenant, $owner);

        foreach ($preferences as $preference) {
            $existing = NotificationPreference::query()
                ->where('tenant_id', $tenant->id)
                ->where('tenant_user_id', $owner->id)
                ->where('notification_type', $preference['notification_type'])
                ->first();

            NotificationPreference::updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'tenant_user_id' => $owner->id,
                    'notification_type' => $preference['notification_type'],
                ],
                [
                    'in_app_enabled' => $preference['in_app_enabled'] ?? $existing?->in_app_enabled ?? true,
                    'email_enabled' => $preference['email_enabled'] ?? $existing?->email_enabled ?? false,
                    'whatsapp_enabled' => $preference['whatsapp_enabled'] ?? $existing?->whatsapp_enabled ?? false,
                ],
            );
        }

        return $this->list($tenant, $owner);
    }

    public function channelEnabled(Tenant $tenant, TenantUser $owner, string $type, string $channel): bool
    {
        if ($owner->tenant_id !== $tenant->id || $owner->status !== 'active') {
            return false;
        }

        $preference = NotificationPreference::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $owner->id)
            ->where('notification_type', $type)
            ->first();

        if (! $preference) {
            return in_array($channel, ['in_app', 'email'], true);
        }

        return match ($channel) {
            'in_app' => (bool) $preference->in_app_enabled,
            'email' => (bool) $preference->email_enabled,
            'whatsapp' => (bool) $preference->whatsapp_enabled,
            default => false,
        };
    }

    private function ensureOwnerInTenant(Tenant $tenant, TenantUser $owner): void
    {
        if ($owner->tenant_id !== $tenant->id || $owner->status !== 'active') {
            throw ValidationException::withMessages([
                'tenant_user_id' => ['The notification preference owner is invalid for this tenant.'],
            ]);
        }
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
