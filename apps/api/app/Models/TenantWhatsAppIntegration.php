<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantWhatsAppIntegration extends Model
{
    use BelongsToTenant;

    public const PROVIDER_META_CLOUD_API = 'meta_whatsapp_cloud_api';

    public const STATUS_INACTIVE = 'inactive';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_ERROR = 'error';

    protected $table = 'tenant_whatsapp_integrations';

    protected $fillable = [
        'tenant_id',
        'provider',
        'is_enabled',
        'phone_number_id',
        'business_account_id',
        'access_token_encrypted',
        'webhook_verify_token_encrypted',
        'app_secret_encrypted',
        'sender_display_phone',
        'status',
        'last_verified_at',
        'metadata',
    ];

    protected $hidden = [
        'access_token_encrypted',
        'webhook_verify_token_encrypted',
        'app_secret_encrypted',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'last_verified_at' => 'datetime',
            'metadata' => 'array',
            'phone_number_id' => 'encrypted',
            'business_account_id' => 'encrypted',
            'access_token_encrypted' => 'encrypted',
            'webhook_verify_token_encrypted' => 'encrypted',
            'app_secret_encrypted' => 'encrypted',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
