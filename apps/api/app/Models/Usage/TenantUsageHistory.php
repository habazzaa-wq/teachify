<?php

namespace App\Models\Usage;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantUsageHistory extends Model
{
    protected $table = 'tenant_usage_history';

    protected $fillable = [
        'tenant_id',
        'period',
        'date',
        'storage_bytes',
        'bandwidth_bytes',
        'views',
        'requests',
        'stream_bandwidth',
        'cdn_bandwidth',
        'metadata',
    ];

    protected $casts = [
        'date' => 'date',
        'storage_bytes' => 'integer',
        'bandwidth_bytes' => 'integer',
        'views' => 'integer',
        'requests' => 'integer',
        'stream_bandwidth' => 'integer',
        'cdn_bandwidth' => 'integer',
        'metadata' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
