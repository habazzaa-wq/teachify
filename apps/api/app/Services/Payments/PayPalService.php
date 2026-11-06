<?php

namespace App\Services\Payments;

use App\Services\Payments\Exceptions\PaymentGatewayException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class PayPalService
{
    private const TIMEOUT = 30;

    private const SUPPORTED_CURRENCIES = [
        'AUD', 'BRL', 'CAD', 'CHF', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF',
        'ILS', 'JPY', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'SAR', 'SEK',
        'SGD', 'THB', 'TWD', 'USD', 'AED',
    ];

    /**
     * Verify credentials against PayPal before allowing a gateway to be enabled.
     *
     * @param  array<string, mixed>  $config
     */
    public function verifyCredentials(array $config): void
    {
        $this->accessToken($config);
    }

    /**
     * Convert EGP prices using the tenant's configured rate; other supported
     * currencies are charged as quoted.
     *
     * @param  array<string, mixed>  $config
     * @return array{amount: string, currency: string}
     */
    public function amountForPayment(array $config, string $amount, string $currency): array
    {
        $sourceCurrency = strtoupper($currency) === 'SR' ? 'SAR' : strtoupper($currency);

        if ($sourceCurrency === 'EGP' || ! in_array($sourceCurrency, self::SUPPORTED_CURRENCIES, true)) {
            $targetCurrency = strtoupper((string) ($config['currency'] ?? 'USD'));
            $exchangeRate = $sourceCurrency === 'EGP'
                ? (float) ($config['exchange_rate'] ?? 0)
                : (float) ($config['exchange_rates'][$sourceCurrency] ?? 0);

            // Accept both common EGP rate formats: target currency per EGP
            // (e.g. 0.02 USD) and EGP per target currency (e.g. 52 EGP/USD).
            if ($sourceCurrency === 'EGP' && $exchangeRate > 1) {
                $exchangeRate = 1 / $exchangeRate;
            }

            if (! in_array($targetCurrency, self::SUPPORTED_CURRENCIES, true)
                || ! is_finite($exchangeRate)
                || $exchangeRate <= 0) {
                throw new PaymentGatewayException('أدخل سعر تحويل لهذه العملة إلى عملة PayPal المختارة أو استخدم فواتيرك.');
            }

            return [
                'amount' => $this->formatAmount((string) ((float) $amount * $exchangeRate)),
                'currency' => $targetCurrency,
            ];
        }

        return [
            'amount' => $this->formatAmount($amount),
            'currency' => $sourceCurrency,
        ];
    }

    /**
     * Create an order and return the approval link.
     *
     * @param  array<string, mixed>  $config
     * @return array{order_id: string, url: string}
     */
    public function createOrder(
        array $config,
        string $reference,
        string $amount,
        string $currency,
        string $description,
        string $returnUrl,
        string $cancelUrl,
    ): array {
        $body = $this->request($config, 'post', '/v2/checkout/orders', [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'reference_id' => $reference,
                'custom_id' => $reference,
                'amount' => [
                    'currency_code' => strtoupper($currency),
                    'value' => $this->formatAmount($amount),
                ],
                'description' => mb_substr($description, 0, 127),
            ]],
            'application_context' => [
                'return_url' => $returnUrl,
                'cancel_url' => $cancelUrl,
                'user_action' => 'PAY_NOW',
            ],
        ], $reference);
        $approvalUrl = collect($body['links'] ?? [])
            ->first(fn (array $link): bool => ($link['rel'] ?? '') === 'approve')['href'] ?? null;

        if (empty($body['id']) || ! is_string($approvalUrl) || ! str_starts_with($approvalUrl, 'https://')) {
            throw new PaymentGatewayException('لم يرجع PayPal رابط موافقة صالحاً.');
        }

        return [
            'order_id' => (string) $body['id'],
            'url' => $approvalUrl,
        ];
    }

    /**
     * Capture an approved order and verify its state, reference, amount, and currency.
     *
     * @param  array<string, mixed>  $config
     * @return array{capture_id: string}
     */
    public function captureOrder(
        array $config,
        string $orderId,
        string $reference,
        string $amount,
        string $currency,
    ): array {
        $body = $this->request(
            $config,
            'post',
            '/v2/checkout/orders/'.rawurlencode($orderId).'/capture',
            [],
            $reference.'-capture',
        );

        $unit = $body['purchase_units'][0] ?? [];
        $capture = $unit['payments']['captures'][0] ?? [];
        $receivedAmount = $capture['amount'] ?? [];

        if (($body['status'] ?? '') !== 'COMPLETED'
            || ($unit['custom_id'] ?? '') !== $reference
            || ($capture['status'] ?? '') !== 'COMPLETED'
            || strtoupper((string) ($receivedAmount['currency_code'] ?? '')) !== strtoupper($currency)
            || $this->formatAmount((string) ($receivedAmount['value'] ?? '')) !== $this->formatAmount($amount)
            || empty($capture['id'])) {
            throw new PaymentGatewayException('تعذر تأكيد مبلغ أو حالة عملية الدفع من PayPal.');
        }

        return ['capture_id' => (string) $capture['id']];
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    private function request(
        array $config,
        string $method,
        string $path,
        array $payload,
        string $requestId,
    ): array {
        $token = $this->accessToken($config);

        try {
            $request = Http::withToken($token)
                ->acceptJson()
                ->asJson()
                ->timeout(self::TIMEOUT)
                ->withHeaders(['PayPal-Request-Id' => substr($requestId, 0, 108)]);
            $response = $request->{$method}($this->baseUrl($config).$path, $payload);
        } catch (ConnectionException $exception) {
            throw new PaymentGatewayException('تعذّر الاتصال بـ PayPal، حاول مرة أخرى لاحقاً.', previous: $exception);
        }

        if ($response->failed()) {
            throw new PaymentGatewayException('رفض PayPal طلب الدفع. تحقق من بيانات الحساب والعملة وحاول مرة أخرى.');
        }

        return $this->responseBody($response);
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function accessToken(array $config): string
    {
        if (empty($config['client_id']) || empty($config['client_secret'])) {
            throw new PaymentGatewayException('بيانات PayPal غير مكتملة.');
        }

        try {
            $response = Http::withBasicAuth((string) $config['client_id'], (string) $config['client_secret'])
                ->asForm()
                ->acceptJson()
                ->timeout(self::TIMEOUT)
                ->post($this->baseUrl($config).'/v1/oauth2/token', ['grant_type' => 'client_credentials']);
        } catch (ConnectionException $exception) {
            throw new PaymentGatewayException('تعذّر الاتصال بـ PayPal للتحقق من بيانات الحساب.', previous: $exception);
        }

        $body = $this->responseBody($response);
        if ($response->failed() || empty($body['access_token'])) {
            throw new PaymentGatewayException('تعذّر التحقق من بيانات PayPal. راجع Client ID وClient Secret والبيئة المختارة.');
        }

        return (string) $body['access_token'];
    }

    /**
     * @return array<string, mixed>
     */
    private function responseBody(Response $response): array
    {
        $body = $response->json();

        if (! is_array($body)) {
            throw new PaymentGatewayException('أعاد PayPal استجابة غير صالحة.');
        }

        return $body;
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function baseUrl(array $config): string
    {
        return ($config['environment'] ?? 'test') === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    private function formatAmount(string $amount): string
    {
        if (! is_numeric($amount) || (float) $amount <= 0) {
            throw new PaymentGatewayException('مبلغ الدفع غير صالح لعملية PayPal.');
        }

        return number_format((float) $amount, 2, '.', '');
    }
}
