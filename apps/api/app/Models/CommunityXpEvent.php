<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityXpEvent extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'tenant_user_id',
        'action_type',
        'xp',
        'message_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'xp' => 'integer',
            'metadata' => 'array',
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

    public function message(): BelongsTo
    {
        return $this->belongsTo(CommunityMessage::class, 'message_id');
    }
}
