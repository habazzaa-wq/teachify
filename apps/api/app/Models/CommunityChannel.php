<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CommunityChannel extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'category_id',
        'slug',
        'name',
        'description',
        'type',
        'sort_order',
        'status',
        'is_locked',
        'is_pinned',
        'allows_questions',
        'last_message_id',
        'last_message_at',
        'created_by_tenant_user_id',
    ];

    protected function casts(): array
    {
        return [
            'is_locked' => 'boolean',
            'is_pinned' => 'boolean',
            'allows_questions' => 'boolean',
            'last_message_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(CommunityCategory::class, 'category_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'created_by_tenant_user_id');
    }

    public function lastMessage(): BelongsTo
    {
        return $this->belongsTo(CommunityMessage::class, 'last_message_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(CommunityMessage::class, 'channel_id');
    }

    public function threads(): HasMany
    {
        return $this->hasMany(CommunityThread::class, 'channel_id');
    }

    public function isArchived(): bool
    {
        return $this->status === 'archived';
    }

    public function isLocked(): bool
    {
        return $this->is_locked;
    }

    public function isPinned(): bool
    {
        return $this->is_pinned;
    }

    public function moderatorOnly(): bool
    {
        return (bool) $this->moderator_only;
    }
}
