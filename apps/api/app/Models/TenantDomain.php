<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantDomain extends Model
{
    protected $fillable = [
        'tenant_id',
        'domain',
        'subdomain',
        'type',
        'status',
        'is_primary',
        'verification_token',
        'verified_at',
        'ssl_status',
        'dns_checked_at',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'verified_at' => 'datetime',
            'dns_checked_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
