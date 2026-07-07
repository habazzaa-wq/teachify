<?php

namespace App\Models;

use Database\Factories\PlatformAdminFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlatformAdmin extends Model
{
    /** @use HasFactory<PlatformAdminFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'role',
        'granted_at',
        'granted_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'granted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function grantedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_by_user_id');
    }

    public function platformAuditLogs(): HasMany
    {
        return $this->hasMany(PlatformAuditLog::class);
    }
}
