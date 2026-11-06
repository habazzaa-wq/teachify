<?php

namespace App\Services\Payments;

use App\Models\Tenant;
use App\Models\TenantSetting;
use App\Services\Payments\Exceptions\PaymentGatewayException;
use Illuminate\Support\Facades\Crypt;

class PaymentGatewayService
{
    public const SETTINGS_GROUP = 'payment_gateway';

    public const PROVIDER = 'fawaterk';

    public const PROVIDERS = ['fawaterk', 'paypal'];

    /**
     * Resolve the tenant's gateway settings, migrating the legacy flat Fawaterk
     * settings in memory so existing tenant integrations keep working.
     *
     * @return array<string, mixed>
     */
    public function rawSettings(Tenant $tenant): array
    {
        $setting = TenantSetting::query()
            ->where('tenant_id', $tenant->id)
            ->where('group', self::SETTINGS_GROUP)
            ->first();

        $values = $setting?->values ?? [];
        if (! isset($values['gateways'])) {
            $values = [
                'gateways' => [
                    self::PROVIDER => [
                        'environment' => $values['environment'] ?? 'test',
                        'is_active' => $values['is_active'] ?? false,
                        'api_key' => $values['api_key'] ?? null,
                        'secret_key' => $values['secret_key'] ?? null,
                    ],
                    'paypal' => [],
                ],
            ];
        }

        foreach (self::PROVIDERS as $provider) {
            $gateway = $values['gateways'][$provider] ?? [];
            if (! empty($gateway['credentials_encrypted'])) {
                foreach (['api_key', 'secret_key', 'client_id', 'client_secret'] as $key) {
                    if (isset($gateway[$key]) && $gateway[$key] !== '') {
                        $gateway[$key] = Crypt::decryptString((string) $gateway[$key]);
                    }
                }
                unset($gateway['credentials_encrypted']);
            }
            $values['gateways'][$provider] = $gateway;
        }

        return $values;
    }

    /**
     * Get one active gateway config for a tenant, or null when it is not usable.
     *
     * @return array<string, mixed>|null
     */
    public function config(Tenant $tenant, string $provider = self::PROVIDER, bool $requireActive = true): ?array
    {
        $settings = $this->rawSettings($tenant);
        $gateway = $settings['gateways'][$provider] ?? [];

        if ($requireActive && empty($gateway['is_active'])) {
            return null;
        }

        if ($provider === 'paypal') {
            if (empty($gateway['client_id'])
                || empty($gateway['client_secret'])
                || empty($gateway['currency'])
                || empty($gateway['exchange_rate'])) {
                return null;
            }

            return [
                'provider' => $provider,
                'environment' => $gateway['environment'] ?? 'test',
                'client_id' => (string) $gateway['client_id'],
                'client_secret' => (string) $gateway['client_secret'],
                'currency' => (string) ($gateway['currency'] ?? 'USD'),
                'exchange_rate' => (float) ($gateway['exchange_rate'] ?? 0),
                'exchange_rates' => is_array($gateway['exchange_rates'] ?? null) ? $gateway['exchange_rates'] : [],
            ];
        }

        if (empty($gateway['api_key'])) {
            return null;
        }

        return [
            'provider' => self::PROVIDER,
            'environment' => $gateway['environment'] ?? 'test',
            'api_key' => (string) $gateway['api_key'],
            'secret_key' => (string) ($gateway['secret_key'] ?? ''),
        ];
    }

    /**
     * Require an active gateway config for a tenant.
     *
     * @return array<string, mixed>
     *
     * @throws PaymentGatewayException
     */
    public function requireConfig(
        Tenant $tenant,
        string $provider = self::PROVIDER,
        bool $requireActive = true,
    ): array {
        $config = $this->config($tenant, $provider, $requireActive);

        if (! $config) {
            throw new PaymentGatewayException('بوابة الدفع المختارة غير مفعّلة أو بيانات الاتصال غير مكتملة.');
        }

        return $config;
    }

    /**
     * Choose the requested active gateway, or the first active gateway.
     *
     * @throws PaymentGatewayException
     */
    public function resolveProvider(Tenant $tenant, ?string $requestedProvider = null): string
    {
        $activeProviders = array_values(array_filter(
            self::PROVIDERS,
            fn (string $provider): bool => $this->config($tenant, $provider) !== null,
        ));

        if ($requestedProvider !== null && in_array($requestedProvider, $activeProviders, true)) {
            return $requestedProvider;
        }

        if ($requestedProvider !== null) {
            throw new PaymentGatewayException('بوابة الدفع المختارة غير مفعّلة لهذه الأكاديمية.');
        }

        if ($activeProviders === []) {
            throw new PaymentGatewayException('لم يتم تفعيل أي بوابة دفع في إعدادات الأكاديمية بعد.');
        }

        return $activeProviders[0];
    }

    /**
     * Save one provider's settings without overwriting the other provider.
     *
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    public function save(Tenant $tenant, string $provider, array $values): array
    {
        $settings = $this->rawSettings($tenant);
        $existing = $settings['gateways'][$provider] ?? [];

        $credentialKeys = $provider === 'paypal'
            ? ['client_id', 'client_secret']
            : ['api_key', 'secret_key'];

        foreach ($credentialKeys as $key) {
            if (array_key_exists($key, $values) && ($values[$key] === null || trim((string) $values[$key]) === '')) {
                unset($values[$key]);
            }
        }

        $settings['gateways'][$provider] = array_merge($existing, $values);
        $persisted = $settings;

        foreach (self::PROVIDERS as $gatewayProvider) {
            $gateway = $persisted['gateways'][$gatewayProvider] ?? [];
            $keys = $gatewayProvider === 'paypal'
                ? ['client_id', 'client_secret']
                : ['api_key', 'secret_key'];

            foreach ($keys as $key) {
                if (! empty($gateway[$key])) {
                    $gateway[$key] = Crypt::encryptString((string) $gateway[$key]);
                }
            }

            $gateway['credentials_encrypted'] = true;
            $persisted['gateways'][$gatewayProvider] = $gateway;
        }

        TenantSetting::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'group' => self::SETTINGS_GROUP,
            ],
            ['values' => $persisted],
        );

        return $this->publicPayload($settings);
    }

    /**
     * Masked settings safe for the frontend.
     *
     * @param  array<string, mixed>  $settings
     * @return array<string, mixed>
     */
    public function publicPayload(array $settings): array
    {
        $gateways = $settings['gateways'] ?? [];
        $fawaterk = $gateways['fawaterk'] ?? [];
        $paypal = $gateways['paypal'] ?? [];

        return [
            'fawaterk' => [
                'provider' => 'fawaterk',
                'environment' => $fawaterk['environment'] ?? 'test',
                'is_active' => (bool) (! empty($fawaterk['is_active']) && ! empty($fawaterk['api_key'])),
                'api_key_masked' => $this->mask((string) ($fawaterk['api_key'] ?? '')),
                'has_api_key' => ! empty($fawaterk['api_key']),
                'has_secret_key' => ! empty($fawaterk['secret_key']),
            ],
            'paypal' => [
                'provider' => 'paypal',
                'environment' => $paypal['environment'] ?? 'test',
                'is_active' => (bool) (
                    ! empty($paypal['is_active'])
                    && ! empty($paypal['client_id'])
                    && ! empty($paypal['client_secret'])
                    && ! empty($paypal['currency'])
                    && ! empty($paypal['exchange_rate'])
                ),
                'client_id_masked' => $this->mask((string) ($paypal['client_id'] ?? '')),
                'has_client_id' => ! empty($paypal['client_id']),
                'has_client_secret' => ! empty($paypal['client_secret']),
                'currency' => (string) ($paypal['currency'] ?? 'USD'),
                'exchange_rate' => isset($paypal['exchange_rate']) ? (float) $paypal['exchange_rate'] : null,
                'exchange_rates' => $paypal['exchange_rates'] ?? [],
            ],
        ];
    }

    /**
     * Public list used by checkout to show the tenant's enabled providers.
     *
     * @return list<string>
     */
    public function activeProviders(Tenant $tenant): array
    {
        return array_values(array_filter(
            self::PROVIDERS,
            fn (string $provider): bool => $this->config($tenant, $provider) !== null,
        ));
    }

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
