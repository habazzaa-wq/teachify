<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityModerationAction extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'subject_tenant_user_id',
        'moderator_tenant_user_id',
        'action',
        'channel_id',
        'message_id',
        'reason',
        'duration_minutes',
        'expires_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'duration_minutes' => 'integer',
            'expires_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'subject_tenant_user_id');
    }

    public function moderator(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'moderator_tenant_user_id');
    }

    public function channel(): BelongsTo
    {
        return $this->belongsTo(CommunityChannel::class, 'channel_id');
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(CommunityMessage::class, 'message_id');
    }
}
