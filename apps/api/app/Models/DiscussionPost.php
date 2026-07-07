<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiscussionPost extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'discussion_thread_id',
        'tenant_user_id',
        'parent_post_id',
        'body',
        'status',
        'edited_at',
        'deleted_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'edited_at' => 'datetime',
            'deleted_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(DiscussionThread::class, 'discussion_thread_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'tenant_user_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(DiscussionPost::class, 'parent_post_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(DiscussionPost::class, 'parent_post_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(DiscussionReport::class, 'discussion_post_id');
    }

    public function isDeleted(): bool
    {
        return $this->status === 'deleted' || $this->deleted_at !== null;
    }

    public function isHidden(): bool
    {
        return $this->status === 'hidden';
    }
}
