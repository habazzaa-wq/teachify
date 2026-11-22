<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantWhatsAppIntegrationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'tenantId' => (string) $this->tenant_id,
            'provider' => $this->provider,
            'isEnabled' => (bool) $this->is_enabled,
            'phoneNumberIdConfigured' => filled($this->phone_number_id),
            'businessAccountIdConfigured' => filled($this->business_account_id),
            'accessTokenConfigured' => filled($this->access_token_encrypted),
            'webhookVerifyTokenConfigured' => filled($this->webhook_verify_token_encrypted),
            'appSecretConfigured' => filled($this->app_secret_encrypted),
            'senderDisplayPhone' => $this->sender_display_phone,
            'status' => $this->status,
            'lastVerifiedAt' => $this->last_verified_at?->toIso8601String(),
            'metadata' => $this->metadata ?? [],
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
