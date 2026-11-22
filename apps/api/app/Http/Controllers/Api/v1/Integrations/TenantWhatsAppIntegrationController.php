<?php

namespace App\Http\Controllers\Api\v1\Integrations;

use App\Http\Controllers\Controller;
use App\Http\Resources\TenantWhatsAppIntegrationResource;
use App\Models\TenantWhatsAppIntegration;
use App\Services\Integrations\WhatsApp\MetaWhatsAppCloudService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TenantWhatsAppIntegrationController extends Controller
{
    public function show(): JsonResponse
    {
        $tenant = currentTenant();
        $integration = TenantWhatsAppIntegration::query()->where('tenant_id', $tenant->id)->first();
        if ($integration) {
            Gate::authorize('view', $integration);
        } else {
            Gate::authorize('viewAny', TenantWhatsAppIntegration::class);
        }

        return response()->json(['data' => $integration ? new TenantWhatsAppIntegrationResource($integration) : null]);
    }

    public function update(Request $request): JsonResponse
    {
        $tenant = currentTenant();
        $integration = TenantWhatsAppIntegration::query()->where('tenant_id', $tenant->id)->first();
        if ($integration) {
            Gate::authorize('update', $integration);
        } else {
            Gate::authorize('create', TenantWhatsAppIntegration::class);
        }

        $validated = $request->validate([
            'is_enabled' => ['sometimes', 'boolean'],
            'phone_number_id' => ['nullable', 'string', 'max:255'],
            'business_account_id' => ['nullable', 'string', 'max:255'],
            'access_token' => ['nullable', 'string', 'max:4096'],
            'webhook_verify_token' => ['nullable', 'string', 'max:4096'],
            'app_secret' => ['nullable', 'string', 'max:4096'],
            'sender_display_phone' => ['nullable', 'string', 'max:50'],
            'metadata' => ['nullable', 'array'],
        ]);

        $payload = [
            'tenant_id' => $tenant->id,
            'provider' => TenantWhatsAppIntegration::PROVIDER_META_CLOUD_API,
        ];
        foreach (['is_enabled', 'phone_number_id', 'business_account_id', 'sender_display_phone', 'metadata'] as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = $validated[$field];
            }
        }
        if (array_key_exists('access_token', $validated)) {
            $payload['access_token_encrypted'] = $validated['access_token'];
        }
        if (array_key_exists('webhook_verify_token', $validated)) {
            $payload['webhook_verify_token_encrypted'] = $validated['webhook_verify_token'];
        }
        if (array_key_exists('app_secret', $validated)) {
            $payload['app_secret_encrypted'] = $validated['app_secret'];
        }

        $integration = TenantWhatsAppIntegration::query()->updateOrCreate(
            ['tenant_id' => $tenant->id],
            $payload
        );

        if (($integration->is_enabled ?? false) && filled($integration->access_token_encrypted) && filled($integration->phone_number_id)) {
            $integration->forceFill(['status' => TenantWhatsAppIntegration::STATUS_ACTIVE])->save();
        } elseif (! ($integration->is_enabled ?? false)) {
            $integration->forceFill(['status' => TenantWhatsAppIntegration::STATUS_INACTIVE])->save();
        }

        return response()->json([
            'message' => 'WhatsApp integration updated.',
            'data' => new TenantWhatsAppIntegrationResource($integration->fresh()),
        ]);
    }

    public function test(MetaWhatsAppCloudService $whatsapp): JsonResponse
    {
        $tenant = currentTenant();
        $integration = TenantWhatsAppIntegration::query()->where('tenant_id', $tenant->id)->firstOrFail();
        Gate::authorize('update', $integration);

        $configured = $whatsapp->isConfiguredAndEnabled($tenant);
        if ($configured) {
            $integration->forceFill(['status' => TenantWhatsAppIntegration::STATUS_ACTIVE, 'last_verified_at' => now()])->save();
        }

        return response()->json([
            'data' => [
                'configured' => $configured,
                'status' => $integration->fresh()->status,
            ],
        ]);
    }
}
