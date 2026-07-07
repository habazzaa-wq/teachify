<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformAuditLog extends Model
{
    // Platform audit logs are immutable append-only records of platform admin
    // actions. They are not tenant-scoped and do not use the BelongsToTenant
    // trait.

    public const UPDATED_AT = null;

    protected $fillable = [
        'platform_admin_id',
        'event_type',
        'entity_type',
        'entity_id',
        'action',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'metadata' => 'array',
        'entity_id' => 'integer',
    ];

    public function platformAdmin(): BelongsTo
    {
        return $this->belongsTo(PlatformAdmin::class);
    }
}
