<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommunityMessage extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'channel_id',
        'thread_id',
        'parent_message_id',
        'reply_to_message_id',
        'tenant_user_id',
        'body',
        'body_text',
        'content_type',
        'status',
        'is_pinned',
        'is_announcement',
        'is_official_answer',
        'is_highlighted',
        'is_solved',
        'metadata',
        'edited_at',
        'deleted_at',
    ];

    protected function casts(): array
    {
        return [
            'is_pinned' => 'boolean',
            'is_announcement' => 'boolean',
            'is_official_answer' => 'boolean',
            'is_highlighted' => 'boolean',
            'is_solved' => 'boolean',
            'metadata' => 'array',
            'edited_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function channel(): BelongsTo
    {
        return $this->belongsTo(CommunityChannel::class, 'channel_id');
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(CommunityThread::class, 'thread_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'tenant_user_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_message_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_message_id');
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reply_to_message_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(CommunityMessageAttachment::class, 'message_id');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(CommunityMessageReaction::class, 'message_id');
    }

    public function mentions(): HasMany
    {
        return $this->hasMany(CommunityMessageMention::class, 'message_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(CommunityReport::class, 'message_id');
    }

    public function isDeleted(): bool
    {
        return $this->status === 'deleted' || $this->deleted_at !== null;
    }

    public function isHidden(): bool
    {
        return $this->status === 'hidden';
    }

    public function isEdited(): bool
    {
        return $this->edited_at !== null;
    }
}
