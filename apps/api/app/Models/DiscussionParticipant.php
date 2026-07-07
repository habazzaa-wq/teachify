<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiscussionParticipant extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'discussion_thread_id',
        'tenant_user_id',
        'last_read_post_id',
        'last_read_at',
    ];

    protected function casts(): array
    {
        return [
            'last_read_post_id' => 'integer',
            'last_read_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(DiscussionThread::class, 'discussion_thread_id');
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'tenant_user_id');
    }
}
