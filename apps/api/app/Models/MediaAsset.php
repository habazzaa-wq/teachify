<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class MediaAsset extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'media_collection_id',
        'folder_id',
        'provider',
        'provider_service',
        'type',
        'source',
        'status',
        'processing_status',
        'visibility',
        'storage_key',
        'external_id',
        'bunny_video_id',
        'bunny_library_id',
        'bunny_storage_path',
        'bunny_stream_url',
        'cdn_url',
        'thumbnail_url',
        'preview_url',
        'original_filename',
        'original_name',
        'title',
        'description',
        'tags',
        'mime_type',
        'extension',
        'size_bytes',
        'size',
        'duration',
        'width',
        'height',
        'checksum',
        'metadata',
        'favorite_at',
        'archived_at',
        'created_by_tenant_user_id',
        'uploader_id',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'size' => 'integer',
            'duration' => 'float',
            'width' => 'integer',
            'height' => 'integer',
            'metadata' => 'array',
            'tags' => 'array',
            'favorite_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(MediaFolder::class, 'folder_id')->withTrashed();
    }

    public function collection(): BelongsTo
    {
        return $this->belongsTo(MediaCollection::class, 'media_collection_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'uploader_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'created_by_tenant_user_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(MediaAssetVariant::class);
    }

    public function captions(): HasMany
    {
        return $this->hasMany(MediaAssetCaption::class);
    }

    public function usages(): HasMany
    {
        return $this->hasMany(MediaAssetUsage::class);
    }

    public function lessonVideos(): HasMany
    {
        return $this->hasMany(LessonVideo::class);
    }

    public function lessonFiles(): HasMany
    {
        return $this->hasMany(LessonFile::class);
    }

    public function assignmentSubmissionFiles(): HasMany
    {
        return $this->hasMany(AssignmentSubmissionFile::class);
    }

    public function videoAnalytics(): HasOne
    {
        return $this->hasOne(VideoAnalytics::class);
    }

    public function isVideo(): bool
    {
        return $this->type === 'video';
    }

    public function isImage(): bool
    {
        return in_array($this->type, ['image', 'Image']);
    }

    public function isDocument(): bool
    {
        return in_array($this->type, ['document', 'Document', 'pdf', 'PDF']);
    }

    public function isFavorite(): bool
    {
        return $this->favorite_at !== null;
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function isReady(): bool
    {
        return $this->status === 'ready';
    }

    public function scopeReady($query)
    {
        return $query->where('status', 'ready');
    }

    public function scopeFavorites($query)
    {
        return $query->whereNotNull('favorite_at');
    }

    public function scopeArchived($query)
    {
        return $query->whereNotNull('archived_at');
    }

    public function scopeNotArchived($query)
    {
        return $query->whereNull('archived_at');
    }

    public function scopeInFolder($query, ?int $folderId)
    {
        if ($folderId === null) {
            return $query->whereNull('folder_id');
        }
        return $query->where('folder_id', $folderId);
    }

    public function scopeOfType($query, ?string $type)
    {
        if ($type === null || $type === 'all') {
            return $query;
        }
        return $query->where('type', $type);
    }
}
