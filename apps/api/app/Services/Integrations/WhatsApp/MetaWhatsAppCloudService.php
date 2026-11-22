<?php

namespace App\Services\Integrations\WhatsApp;

use App\Models\Tenant;
use App\Models\TenantWhatsAppIntegration;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class MetaWhatsAppCloudService
{
    public function integrationFor(Tenant $tenant): ?TenantWhatsAppIntegration
    {
        return TenantWhatsAppIntegration::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->first();
    }

    public function isConfiguredAndEnabled(Tenant $tenant): bool
    {
        $integration = $this->integrationFor($tenant);
        return $integration
            && $integration->is_enabled
            && filled($integration->phone_number_id)
            && filled($integration->access_token_encrypted);
    }

    /**
     * @param array<string,mixed> $payload
     * @return array<string,mixed>
     */
    public function sendText(Tenant $tenant, string $to, string $body, array $payload = []): array
    {
        $integration = $this->integrationFor($tenant);
        if (! $integration || ! $integration->is_enabled) {
            throw new RuntimeException('WhatsApp integration is not enabled.');
        }

        $phoneNumberId = (string) $integration->phone_number_id;
        $token = (string) $integration->access_token_encrypted;
        $version = (string) data_get($integration->metadata, 'api_version', 'v20.0');

        $templateName = $payload['template_name'] ?? data_get($integration->metadata, 'default_template_name');
        $language = $payload['template_language'] ?? data_get($integration->metadata, 'default_template_language', 'en');

        $endpoint = "https://graph.facebook.com/{$version}/{$phoneNumberId}/messages";
        $messageBody = $this->buildMessage($to, $body, $templateName, $language, $payload);

        $response = Http::timeout(15)
            ->withToken($token)
            ->acceptJson()
            ->post($endpoint, $messageBody);

        if ($response->failed()) {
            Log::warning('whatsapp.send_failed', [
                'tenant_id' => $tenant->id,
                'status' => $response->status(),
                'body' => $response->json('error.message'),
            ]);
            throw new RuntimeException('WhatsApp API request failed: '.($response->json('error.message') ?? 'unknown error'));
        }

        return $response->json() ?? [];
    }

    /**
     * @param array<string,mixed> $payload
     * @return array<string,mixed>
     */
    private function buildMessage(string $to, string $body, mixed $templateName, string $language, array $payload): array
    {
        $to = preg_replace('/[^\d+]/', '', $to) ?? $to;

        if (filled($templateName)) {
            $parameters = [];
            $text = mb_substr(trim($body), 0, 1000);
            if ($text !== '') {
                $parameters[] = ['type' => 'text', 'text' => $text];
            }
            $components = $parameters ? [['type' => 'body', 'parameters' => $parameters]] : [];
            $message = [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => 'template',
                'template' => [
                    'name' => (string) $templateName,
                    'language' => ['code' => $language],
                ],
            ];
            if ($components !== []) {
                $message['template']['components'] = $components;
            }
            return $message;
        }

        return [
            'messaging_product' => 'whatsapp',
            'to' => $to,
            'type' => 'text',
            'text' => ['preview_url' => false, 'body' => mb_substr(trim($body), 0, 4096)],
        ];
    }
}
