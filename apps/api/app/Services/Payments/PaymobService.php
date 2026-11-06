<?php

namespace App\Services\Payments;

use App\Services\Payments\Exceptions\PaymentGatewayException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class PaymobService
{
    private const BASE_URL = 'https://accept.paymob.com';

    private const TIMEOUT = 30;

    private const HMAC_FIELDS = [
        'amount_cents',
        'created_at',
        'currency',
        'error_occured',
        'has_parent_transaction',
        'id',
        'integration_id',
        'is_3d_secure',
        'is_auth',
        'is_capture',
        'is_refunded',
        'is_standalone_payment',
        'is_voided',
        'order',
        'owner',
        'pending',
        'source_data.pan',
        'source_data.sub_type',
        'source_data.type',
        'success',
    ];

    /**
     * Verify the tenant's Paymob API key before enabling the gateway.
     *
     * @param  array<string, mixed>  $config
     */
    public function verifyCredentials(array $config): void
    {
        $this->accessToken($config);
    }

    /**
     * Convert a quoted course price to the currency configured for the merchant integration.
     *
     * @param  array<string, mixed>  $config
     * @return array{amount: string, currency: string}
     */
    public function amountForPayment(array $config, string $amount, string $currency): array
    {
        if (! is_numeric($amount) || (float) $amount <= 0) {
            throw new PaymentGatewayException('مبلغ الدفع غير صالح لعملية Paymob.');
        }

        $sourceCurrency = strtoupper($currency) === 'SR' ? 'SAR' : strtoupper($currency);
        $targetCurrency = strtoupper((string) ($config['currency'] ?? 'EGP'));

        if ($sourceCurrency === $targetCurrency) {
            return ['amount' => $this->formatAmount($amount), 'currency' => $targetCurrency];
        }

        $exchangeRate = $sourceCurrency === 'EGP'
            ? (float) ($config['exchange_rate'] ?? 0)
            : (float) ($config['exchange_rates'][$sourceCurrency] ?? 0);

        if ($sourceCurrency === 'EGP' && $exchangeRate > 1) {
            $exchangeRate = 1 / $exchangeRate;
        }

        if (! is_finite($exchangeRate) || $exchangeRate <= 0) {
            throw new PaymentGatewayException(
                'أدخل سعر التحويل من '.$sourceCurrency.' إلى عملة Paymob أو استخدم بوابة أخرى.',
            );
        }

        return [
            'amount' => $this->formatAmount((string) ((float) $amount * $exchangeRate)),
            'currency' => $targetCurrency,
        ];
    }

    /**
     * Create a hosted Paymob checkout URL using the tenant's card integration.
     *
     * @param  array<string, mixed>  $config
     * @param  array{first_name: string, last_name: string, email: string, phone: string, country: string}  $customer
     * @return array{order_id: string, transaction_id: string, url: string}
     */
    public function createPaymentLink(
        array $config,
        string $reference,
        string $amount,
        string $currency,
        array $customer,
        string $notificationUrl,
        string $redirectionUrl,
    ): array {
        $amountCents = $this->amountInCents($amount);
        $token = $this->accessToken($config);

        $order = $this->post('/api/ecommerce/orders', [
            'auth_token' => $token,
            'delivery_needed' => false,
            'amount_cents' => $amountCents,
            'currency' => strtoupper($currency),
            'merchant_order_id' => $reference,
            'items' => [],
        ]);
        if (empty($order['id'])) {
            throw new PaymentGatewayException('لم يرجع Paymob رقم طلب صالحاً.');
        }

        $paymentKey = $this->post('/api/acceptance/payment_keys', [
            'auth_token' => $token,
            'amount_cents' => $amountCents,
            'expiration' => 3600,
            'order_id' => $order['id'],
            'billing_data' => [
                'first_name' => $customer['first_name'] ?: 'Student',
                'last_name' => $customer['last_name'] ?: 'Teachify',
                'email' => $customer['email'] ?: 'customer@example.com',
                'phone_number' => $customer['phone'] ?: '01000000000',
                'apartment' => 'NA',
                'floor' => 'NA',
                'street' => 'NA',
                'building' => 'NA',
                'shipping_method' => 'NA',
                'postal_code' => 'NA',
                'city' => 'NA',
                'country' => strtoupper($customer['country'] ?: 'EG'),
                'state' => 'NA',
            ],
            'currency' => strtoupper($currency),
            'integration_id' => (int) $config['integration_id'],
            'lock_order_when_paid' => true,
            'notification_url' => $notificationUrl,
            'redirection_url' => $redirectionUrl,
        ]);

        if (empty($paymentKey['token']) || ! is_string($paymentKey['token'])) {
            throw new PaymentGatewayException('لم يرجع Paymob مفتاح دفع صالحاً.');
        }

        return [
            'order_id' => (string) $order['id'],
            'transaction_id' => '',
            'url' => self::BASE_URL.'/api/acceptance/iframes/'
                .rawurlencode((string) $config['iframe_id'])
                .'?payment_token='.rawurlencode($paymentKey['token']),
        ];
    }

    /**
     * Verify a Paymob transaction callback using the tenant's HMAC secret.
     *
     * @param  array<string, mixed>  $payload
     */
    public function verifyCallback(array $payload, string $hmac, string $hmacSecret): bool
    {
        if ($hmac === '' || $hmacSecret === '') {
            return false;
        }

        $values = [];
        foreach (self::HMAC_FIELDS as $field) {
            $value = $this->fieldValue($payload, $field);
            if (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            }
            $values[] = (string) ($value ?? 'false');
        }

        $expected = hash_hmac('sha512', implode('', $values), $hmacSecret);

        return hash_equals(strtolower($expected), strtolower($hmac));
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function fieldValue(array $payload, string $field): mixed
    {
        if ($field === 'is_refunded' && ! array_key_exists($field, $payload)) {
            return $payload['is_refund'] ?? null;
        }

        if ($field === 'order' && is_array($payload['order'] ?? null)) {
            return $payload['order']['id'] ?? null;
        }

        if (array_key_exists($field, $payload)) {
            return $payload[$field];
        }

        if (str_starts_with($field, 'source_data.')) {
            return $payload[$field]
                ?? $payload[str_replace('.', '_', $field)]
                ?? data_get($payload, $field);
        }

        return $payload[$field] ?? null;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function post(string $path, array $payload): array
    {
        try {
            $response = Http::acceptJson()
                ->asJson()
                ->timeout(self::TIMEOUT)
                ->post(self::BASE_URL.$path, $payload);
        } catch (ConnectionException $exception) {
            throw new PaymentGatewayException('تعذّر الاتصال بـ Paymob، حاول مرة أخرى لاحقاً.', previous: $exception);
        }

        $body = $response->json();
        if ($response->failed() || ! is_array($body)) {
            throw new PaymentGatewayException('رفض Paymob طلب الدفع. تحقق من بيانات الربط والعملة.');
        }

        return $body;
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function accessToken(array $config): string
    {
        if (empty($config['api_key'])) {
            throw new PaymentGatewayException('أدخل مفتاح API الخاص بحساب Paymob.');
        }

        $body = $this->post('/api/auth/tokens', ['api_key' => $config['api_key']]);
        if (empty($body['token']) || ! is_string($body['token'])) {
            throw new PaymentGatewayException('تعذّر التحقق من مفتاح API الخاص بـ Paymob.');
        }

        return $body['token'];
    }

    private function amountInCents(string $amount): int
    {
        if (! is_numeric($amount) || (float) $amount <= 0 || (float) $amount > 100000000) {
            throw new PaymentGatewayException('مبلغ الدفع غير صالح لعملية Paymob.');
        }

        return (int) round((float) $amount * 100);
    }

    private function formatAmount(string $amount): string
    {
        if (! is_numeric($amount) || (float) $amount <= 0) {
            throw new PaymentGatewayException('مبلغ الدفع غير صالح لعملية Paymob.');
        }

        return number_format((float) $amount, 2, '.', '');
    }
}
