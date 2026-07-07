<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use App\Models\PlatformAdmin;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Request as RequestFacade;

class AuditLogService
{
    /**
     * Keys that must never be persisted in audit payloads.
     */
    private const REDACTED_KEYS = [
        'password',
        'password_confirmation',
        'current_password',
        'token',
        'token_hash',
        'secret',
        'webhook_secret',
        'api_key',
        'private_key',
        'refresh_token',
        'verification_token',
        'invitation_token',
    ];

    /**
     * Record a tenant-scoped audit event.
     *
     * @param array<string, mixed>|null  $oldValues
     * @param array<string, mixed>|null  $newValues
     * @param array<string, mixed>|null  $metadata
     */
    public function record(
        Tenant $tenant,
        string $eventType,
        string $entityType,
        int|string $entityId,
        string $action,
        ?TenantUser $actor = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $metadata = null,
        ?Request $request = null,
    ): AuditLog {
        return AuditLog::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $actor?->id,
            'user_id' => $actor?->user_id,
            'event_type' => $eventType,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => $action,
            'old_values' => $this->redact($oldValues),
            'new_values' => $this->redact($newValues),
            'metadata' => $this->redact($metadata),
            'ip_address' => $this->ipAddress($request),
            'user_agent' => $this->userAgent($request),
        ])->refresh();
    }

    /**
     * Record a platform-level audit event (no tenant context).
     *
     * @param array<string, mixed>|null  $metadata
     */
    public function recordPlatform(
        PlatformAdmin $admin,
        string $eventType,
        string $entityType,
        int|string $entityId,
        string $action,
        ?array $metadata = null,
        ?Request $request = null,
    ): AuditLog {
        return AuditLog::create([
            'tenant_id' => null,
            'tenant_user_id' => null,
            'user_id' => $admin->user_id,
            'event_type' => $eventType,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => $action,
            'old_values' => null,
            'new_values' => null,
            'metadata' => $this->redact($metadata),
            'ip_address' => $this->ipAddress($request),
            'user_agent' => $this->userAgent($request),
        ])->refresh();
    }

    /**
     * @param array<string, mixed>|null  $payload
     * @return array<string, mixed>|null
     */
    private function redact(?array $payload): ?array
    {
        if ($payload === null) {
            return null;
        }

        $redacted = [];

        foreach ($payload as $key => $value) {
            if (in_array($key, self::REDACTED_KEYS, true)) {
                $redacted[$key] = '[redacted]';

                continue;
            }

            $redacted[$key] = is_array($value) ? $this->redact($value) : $value;
        }

        return $redacted;
    }

    private function ipAddress(?Request $request): ?string
    {
        $request ??= RequestFacade::instance();

        return $request?->ip();
    }

    private function userAgent(?Request $request): ?string
    {
        $request ??= RequestFacade::instance();

        $agent = $request?->userAgent();

        return $agent === null ? null : mb_substr($agent, 0, 1000);
    }
}
