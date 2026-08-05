<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityFollow extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'tenant_user_id',
        'channel_id',
        'thread_id',
        'muted',
    ];

    protected function casts(): array
    {
        return [
            'muted' => 'boolean',
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

    public function channel(): BelongsTo
    {
        return $this->belongsTo(CommunityChannel::class, 'channel_id');
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(CommunityThread::class, 'thread_id');
    }
}
