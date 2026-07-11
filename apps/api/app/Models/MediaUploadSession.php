<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MediaUploadSession extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'media_asset_id',
        'created_by_tenant_user_id',
        'provider',
        'provider_service',
        'status',
        'expires_at',
        'metadata',
        'upload_id',
        'file_name',
        'mime_type',
        'size',
        'storage_zone',
        'total_chunks',
        'uploaded_chunks',
        'completed',
        'final_file_hash',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'metadata' => 'array',
            'size' => 'integer',
            'total_chunks' => 'integer',
            'uploaded_chunks' => 'array',
            'completed' => 'boolean',
            'final_file_hash' => 'string',
        ];
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'media_asset_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'created_by_tenant_user_id');
    }

    public function chunks(): HasMany
    {
        return $this->hasMany(MediaUploadChunk::class);
    }

    /** Append a chunk index to the completed bitmap (idempotent, ordered). */
    public function markChunkUploaded(int $index): void
    {
        $uploaded = $this->uploaded_chunks ?? [];
        if (! in_array($index, $uploaded, true)) {
            $uploaded[] = $index;
            sort($uploaded);
        }
        $this->uploaded_chunks = $uploaded;
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isBefore(now());
    }
}
