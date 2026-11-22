<?php

namespace App\Http\Controllers\Api\v1\Integrations;

use App\Http\Controllers\Controller;
use App\Models\NotificationDelivery;
use App\Models\Tenant;
use App\Models\TenantWhatsAppIntegration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WhatsAppWebhookController extends Controller
{
    public function verify(Request $request, string $tenant): JsonResponse|\Illuminate\Http\Response
    {
        $tenantModel = Tenant::withoutGlobalScopes()->where('id', $tenant)->orWhere('slug', $tenant)->firstOrFail();
        $integration = TenantWhatsAppIntegration::withoutGlobalScopes()->where('tenant_id', $tenantModel->id)->first();

        $mode = $request->query('hub_mode', $request->query('hub.mode'));
        $token = $request->query('hub_verify_token', $request->query('hub.verify_token'));
        $challenge = $request->query('hub_challenge', $request->query('hub.challenge'));

        $expected = $integration?->webhook_verify_token_encrypted;
        if ($mode === 'subscribe' && $expected && hash_equals((string) $expected, (string) $token)) {
            return response((string) $challenge, 200)->header('Content-Type', 'text/plain');
        }

        return response()->json(['message' => 'Forbidden'], 403);
    }

    public function handle(Request $request, string $tenant): JsonResponse
    {
        $tenantModel = Tenant::withoutGlobalScopes()->where('id', $tenant)->orWhere('slug', $tenant)->firstOrFail();
        $integration = TenantWhatsAppIntegration::withoutGlobalScopes()->where('tenant_id', $tenantModel->id)->first();
        if (! $integration) {
            return response()->json(['ok' => true]);
        }

        // Best-effort signature validation when app secret configured.
        $appSecret = $integration->app_secret_encrypted;
        $signature = $request->header('X-Hub-Signature-256');
        if ($appSecret && $signature) {
            $expected = 'sha256='.hash_hmac('sha256', $request->getContent(), (string) $appSecret);
            if (! hash_equals($expected, (string) $signature)) {
                return response()->json(['message' => 'Invalid signature'], 403);
            }
        }

        $statuses = data_get($request->all(), 'entry.0.changes.0.value.statuses', []);
        foreach ($statuses as $status) {
            $id = $status['id'] ?? null;
            $state = $status['status'] ?? null;
            if (! $id || ! $state) continue;

            $delivery = NotificationDelivery::withoutGlobalScopes()
                ->where('tenant_id', $tenantModel->id)
                ->where('provider', 'meta_whatsapp_cloud_api')
                ->where('provider_message_id', $id)
                ->first();
            if (! $delivery) continue;

            $mapped = match ($state) {
                'sent' => 'sent',
                'delivered', 'read' => 'delivered',
                'failed' => 'failed',
                default => null,
            };
            if (! $mapped) continue;

            $updates = ['status' => $mapped, 'last_attempt_at' => now()];
            if ($mapped === 'delivered') $updates['delivered_at'] = now();
            if ($mapped === 'failed') {
                $updates['failed_at'] = now();
                $updates['last_error'] = mb_substr((string) data_get($status, 'errors.0.title', 'provider_failed'), 0, 1000);
            }
            $delivery->forceFill($updates)->save();
        }

        Log::info('whatsapp.webhook.received', ['tenant_id' => $tenantModel->id]);

        return response()->json(['ok' => true]);
    }
}
