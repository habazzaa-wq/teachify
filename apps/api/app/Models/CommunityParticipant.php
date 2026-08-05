<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CommunityParticipant extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'tenant_user_id',
        'role',
        'status',
        'joined_at',
        'muted_until',
        'muted_reason',
        'banned_until',
        'banned_reason',
        'notification_prefs',
    ];

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
            'muted_until' => 'datetime',
            'banned_until' => 'datetime',
            'notification_prefs' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'tenant_user_id');
    }

    public function isMuted(): bool
    {
        return $this->status === 'muted'
            || ($this->muted_until !== null && $this->muted_until->isFuture());
    }

    public function isBanned(): bool
    {
        return $this->status === 'banned'
            || ($this->banned_until !== null && $this->banned_until->isFuture());
    }
}
