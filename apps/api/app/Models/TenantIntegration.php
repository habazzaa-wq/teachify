<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantIntegration extends Model
{
    protected $fillable = [
        'tenant_id',
        'provider',
        'service',
        'status',
        'external_id',
        'config',
        'last_error',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
