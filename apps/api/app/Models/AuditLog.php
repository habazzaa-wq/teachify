<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    // Audit logs are immutable. They deliberately do NOT use the
    // BelongsToTenant trait: tenant_id is nullable for platform-level events,
    // and every query must scope tenant_id explicitly rather than through the
    // global scope. UPDATED_AT is disabled since records are append-only.

    public const UPDATED_AT = null;

    protected $fillable = [
        'tenant_id',
        'tenant_user_id',
        'user_id',
        'event_type',
        'entity_type',
        'entity_id',
        'action',
        'old_values',
        'new_values',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'metadata' => 'array',
        'entity_id' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function tenantUser(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
