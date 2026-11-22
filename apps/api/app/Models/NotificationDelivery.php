<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationDelivery extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'notification_id',
        'channel',
        'provider',
        'provider_message_id',
        'status',
        'attempts',
        'last_attempt_at',
        'delivered_at',
        'last_error',
        'payload_snapshot',
        'sent_at',
        'failed_at',
        'next_retry_at',
        'dedupe_key',
    ];

    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
            'last_attempt_at' => 'datetime',
            'delivered_at' => 'datetime',
            'payload_snapshot' => 'array',
            'sent_at' => 'datetime',
            'failed_at' => 'datetime',
            'next_retry_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function notification(): BelongsTo
    {
        return $this->belongsTo(Notification::class);
    }
}
