<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class MediaFolder extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'parent_id',
        'name',
        'slug',
        'path',
        'sort_order',
    ];

    protected static function booted(): void
    {
        static::creating(function (MediaFolder $folder) {
            if (empty($folder->slug)) {
                $folder->slug = Str::slug($folder->name) . '-' . Str::random(6);
            }
        });

        static::saved(function (MediaFolder $folder) {
            if ($folder->path === null || $folder->wasChanged('parent_id') || $folder->wasChanged('name')) {
                $folder->refreshPath();
            }
        });
    }

    public function refreshPath(): void
    {
        $parts = [];
        $current = $this;

        while ($current) {
            $parts[] = $current->name;
            $current = $current->parent;
        }

        $this->forceFill(['path' => implode('/', array_reverse($parts))])
            ->saveQuietly();
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order')->orderBy('name');
    }

    public function assets(): HasMany
    {
        return $this->hasMany(MediaAsset::class, 'folder_id');
    }

    public function allDescendantIds(): array
    {
        $ids = [];
        foreach ($this->children as $child) {
            $ids[] = $child->id;
            $ids = array_merge($ids, $child->allDescendantIds());
        }
        return $ids;
    }
}
