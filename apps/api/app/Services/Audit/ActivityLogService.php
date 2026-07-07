<?php

namespace App\Services\Audit;

use App\Models\ActivityLog;
use App\Models\Tenant;
use App\Models\TenantUser;

class ActivityLogService
{
    /**
     * Same redaction guard as audit logs: activity metadata must never carry
     * secrets even though it is lightweight.
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
    ];

    /**
     * Record a lightweight learner/instructor activity event.
     *
     * @param array<string, mixed>|null  $metadata
     */
    public function record(
        Tenant $tenant,
        TenantUser $actor,
        string $activityType,
        string $entityType,
        int|string $entityId,
        ?array $metadata = null,
    ): ActivityLog {
        return ActivityLog::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $actor->id,
            'activity_type' => $activityType,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'metadata' => $this->redact($metadata),
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
}
