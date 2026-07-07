<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    // Activity logs are append-only learner/instructor events. They do NOT use
    // the BelongsToTenant trait; every query must scope tenant_id explicitly,
    // keeping these lightweight records decoupled from the request tenant scope.

    public const UPDATED_AT = null;

    protected $fillable = [
        'tenant_id',
        'tenant_user_id',
        'activity_type',
        'entity_type',
        'entity_id',
        'metadata',
    ];

    protected $casts = [
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
}
