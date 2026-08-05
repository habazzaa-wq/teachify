<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityStat extends Model
{
    use BelongsToTenant;

    public const ACTIVE_MEMBERS = 'active_members';
    public const ONLINE_MEMBERS = 'online_members';
    public const TODAY_MESSAGES = 'today_messages';
    public const TOTAL_MESSAGES = 'total_messages';
    public const TOTAL_THREADS = 'total_threads';
    public const TOTAL_REACTIONS = 'total_reactions';
    public const LATEST_MESSAGE = 'latest_message';

    protected $table = 'community_stats';

    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
        'key',
        'value',
        'payload',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'integer',
            'payload' => 'array',
            'updated_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
