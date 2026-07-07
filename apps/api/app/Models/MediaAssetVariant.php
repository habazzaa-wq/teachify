<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaAssetVariant extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'media_asset_id',
        'type',
        'status',
        'storage_key',
        'external_id',
        'mime_type',
        'size_bytes',
        'width',
        'height',
        'duration_seconds',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'duration_seconds' => 'integer',
            'metadata' => 'array',
        ];
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'media_asset_id');
    }
}
