<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityMessageMention extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'message_id',
        'mentioned_tenant_user_id',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(CommunityMessage::class, 'message_id');
    }

    public function mentionedMember(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'mentioned_tenant_user_id');
    }
}
