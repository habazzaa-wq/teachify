<?php

namespace App\Services\Payments;

use App\Models\Tenant;
use App\Models\TenantSetting;
use App\Services\Payments\Exceptions\PaymentGatewayException;

class PaymentGatewayService
{
    public const SETTINGS_GROUP = 'payment_gateway';

    public const PROVIDER = 'fawaterk';

    /**
     * Resolve the raw gateway settings for a tenant.
     *
     * @return array<string, mixed>
     */
    public function rawSettings(Tenant $tenant): array
    {
        $setting = TenantSetting::query()
            ->where('tenant_id', $tenant->id)
            ->where('group', self::SETTINGS_GROUP)
            ->first();

        return $setting?->values ?? [];
    }

    /**
     * Get the active gateway config for a tenant, or null when not usable.
     *
     * @return array<string, mixed>|null
     */
    public function config(Tenant $tenant): ?array
    {
        $settings = $this->rawSettings($tenant);

        if (empty($settings['is_active']) || empty($settings['api_key'])) {
            return null;
        }

        return [
            'provider' => $settings['provider'] ?? self::PROVIDER,
            'environment' => $settings['environment'] ?? 'test',
            'api_key' => (string) $settings['api_key'],
            'secret_key' => (string) ($settings['secret_key'] ?? ''),
        ];
    }

    /**
     * Require a usable gateway config for a tenant.
     *
     * @return array<string, mixed>
     *
     * @throws PaymentGatewayException
     */
    public function requireConfig(Tenant $tenant): array
    {
        $config = $this->config($tenant);

        if (! $config) {
            throw new PaymentGatewayException('لم يتم تفعيل بوابة الدفع في إعدادات الأكاديمية بعد.');
        }

        return $config;
    }

    /**
     * Persist gateway settings (partial update, keeps existing secret values when blank).
     *
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    public function save(Tenant $tenant, array $values): array
    {
        $existing = $this->rawSettings($tenant);

        // Never wipe stored keys with an empty string.
        foreach (['api_key', 'secret_key'] as $key) {
            if (array_key_exists($key, $values) && ($values[$key] === null || trim((string) $values[$key]) === '')) {
                unset($values[$key]);
            }
        }

        $merged = array_merge($existing, $values);

        TenantSetting::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'group' => self::SETTINGS_GROUP,
            ],
            ['values' => $merged],
        );

        return $this->publicPayload($merged);
    }

    /**
     * Masked view of the settings safe for the frontend.
     *
     * @param  array<string, mixed>  $settings
     * @return array<string, mixed>
     */
    public function publicPayload(array $settings): array
    {
        return [
            'provider' => $settings['provider'] ?? self::PROVIDER,
            'environment' => $settings['environment'] ?? 'test',
            'is_active' => (bool) ($settings['is_active'] ?? false),
            'api_key_masked' => $this->mask((string) ($settings['api_key'] ?? '')),
            'has_api_key' => ! empty($settings['api_key']),
            'has_secret_key' => ! empty($settings['secret_key']),
            'updated_at' => isset($settings['updated_at']) ? (string) $settings['updated_at'] : null,
        ];
    }

    /**
     * Build a unique payment reference for a wallet top-up.
     */
    public function generateReference(): string
    {
        return 'WALLET-'.strtoupper(substr(bin2hex(random_bytes(8)), 0, 16));
    }

    private function mask(string $value): string
    {
        if ($value === '') {
            return '';
        }

        $length = strlen($value);
        if ($length <= 8) {
            return str_repeat('•', $length);
        }

        return substr($value, 0, 4).str_repeat('•', max(6, $length - 8)).substr($value, -4);
    }
}
