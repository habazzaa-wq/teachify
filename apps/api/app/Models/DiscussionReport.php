<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiscussionReport extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'discussion_post_id',
        'reported_by_tenant_user_id',
        'reason',
        'note',
        'status',
        'reviewed_by_tenant_user_id',
        'reviewed_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(DiscussionPost::class, 'discussion_post_id');
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'reported_by_tenant_user_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'reviewed_by_tenant_user_id');
    }

    public function isOpen(): bool
    {
        return $this->status === 'pending';
    }
}
