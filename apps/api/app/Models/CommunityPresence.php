<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityPresence extends Model
{
    use BelongsToTenant;

    protected $table = 'community_presence';

    protected $fillable = [
        'tenant_id',
        'tenant_user_id',
        'status',
        'current_channel_id',
        'last_seen_at',
    ];

    protected function casts(): array
    {
        return [
            'last_seen_at' => 'datetime',
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
        return $this->belongsTo(CommunityChannel::class, 'current_channel_id');
    }
}
