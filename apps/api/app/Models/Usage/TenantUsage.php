<?php

namespace App\Models\Usage;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantUsage extends Model
{
    protected $table = 'tenant_usage';

    protected $fillable = [
        'tenant_id',
        'storage_bytes',
        'bandwidth_bytes',
        'stream_bandwidth_bytes',
        'cdn_bandwidth_bytes',
        'requests',
        'views',
        'uploaded_files',
        'uploaded_videos',
        'collections',
        'folders',
        'last_synced_at',
        'metadata',
    ];

    protected $casts = [
        'storage_bytes' => 'integer',
        'bandwidth_bytes' => 'integer',
        'stream_bandwidth_bytes' => 'integer',
        'cdn_bandwidth_bytes' => 'integer',
        'requests' => 'integer',
        'views' => 'integer',
        'uploaded_files' => 'integer',
        'uploaded_videos' => 'integer',
        'collections' => 'integer',
        'folders' => 'integer',
        'last_synced_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
