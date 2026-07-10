<?php

namespace App\Models\Usage;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantUsageSnapshot extends Model
{
    protected $table = 'tenant_usage_snapshots';

    protected $fillable = [
        'tenant_id',
        'snapshot_at',
        'storage_bytes',
        'bandwidth_bytes',
        'views',
        'requests',
        'metadata',
    ];

    protected $casts = [
        'snapshot_at' => 'datetime',
        'storage_bytes' => 'integer',
        'bandwidth_bytes' => 'integer',
        'views' => 'integer',
        'requests' => 'integer',
        'metadata' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
