<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityReadReceipt extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'channel_id',
        'thread_id',
        'tenant_user_id',
        'last_read_message_id',
        'last_read_at',
    ];

    protected function casts(): array
    {
        return [
            'last_read_at' => 'datetime',
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

    public function member(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'tenant_user_id');
    }

    public function lastMessage(): BelongsTo
    {
        return $this->belongsTo(CommunityMessage::class, 'last_read_message_id');
    }
}
