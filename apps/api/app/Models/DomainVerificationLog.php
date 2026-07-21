<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DomainVerificationLog extends Model
{
    protected $fillable = [
        'tenant_domain_id',
        'action',
        'status',
        'message',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function tenantDomain(): BelongsTo
    {
        return $this->belongsTo(TenantDomain::class);
    }
}
