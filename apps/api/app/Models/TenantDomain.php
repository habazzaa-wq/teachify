<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'verification_method',
        'verification_type',
        'expected_ip',
        'verified_at',
        'verification_errors',
        'last_dns_check',
        'ssl_status',
        'ssl_provider',
        'ssl_issued_at',
        'ssl_expires_at',
        'ssl_renewal_attempts',
        'ssl_last_error',
        'ssl_last_check',
        'dns_checked_at',
        'last_health_check_at',
        'health_score',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'verified_at' => 'datetime',
            'dns_checked_at' => 'datetime',
            'last_dns_check' => 'datetime',
            'ssl_issued_at' => 'datetime',
            'ssl_expires_at' => 'datetime',
            'ssl_last_check' => 'datetime',
            'last_health_check_at' => 'datetime',
            'ssl_renewal_attempts' => 'integer',
            'health_score' => 'integer',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function verificationLogs(): HasMany
    {
        return $this->hasMany(DomainVerificationLog::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePendingCustom($query)
    {
        return $query->where('status', 'pending')
            ->where('type', 'custom_domain');
    }
}
