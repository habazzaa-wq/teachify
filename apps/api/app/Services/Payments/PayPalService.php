<?php

namespace App\Services\Payments;

use App\Services\Payments\Exceptions\PaymentGatewayException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
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
     * Convert a quoted amount into a currency PayPal can charge.
     *
     * @return array{amount: string, currency: string, exchange_rate: string}
     */
    public function amountForPayment(string $amount, string $currency, ?string $targetCurrency = null): array
    {
        $sourceCurrency = strtoupper($currency) === 'SR' ? 'SAR' : strtoupper($currency);
        $paymentCurrency = $targetCurrency === null
            ? $sourceCurrency
            : strtoupper($targetCurrency);

        if (! in_array($paymentCurrency, self::SUPPORTED_CURRENCIES, true)) {
            throw new PaymentGatewayException(
                $targetCurrency === null
                    ? 'PayPal لا يدعم الدفع بعملة هذا السعر. اختر بوابة أخرى تدعم العملة المحددة للدورة.'
                    : 'عملة الدفع المختارة غير مدعومة من PayPal. اختر عملة أخرى.',
            );
        }

        if (! is_numeric($amount) || (float) $amount <= 0) {
            throw new PaymentGatewayException('مبلغ الدفع غير صالح لعملية PayPal.');
        }

        $rate = $sourceCurrency === $paymentCurrency
            ? 1.0
            : $this->exchangeRate($sourceCurrency, $paymentCurrency);

        return [
            'amount' => $this->formatAmount((string) ((float) $amount * $rate), $paymentCurrency),
            'currency' => $paymentCurrency,
            'exchange_rate' => rtrim(rtrim(number_format($rate, 8, '.', ''), '0'), '.'),
        ];
    }

    /**
     * @return list<string>
     */
    public function supportedCurrencies(): array
    {
        return self::SUPPORTED_CURRENCIES;
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
                    'value' => $this->formatAmount($amount, $currency),
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
            || $this->formatAmount((string) ($receivedAmount['value'] ?? ''), $currency) !== $this->formatAmount($amount, $currency)
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

    private function formatAmount(string $amount, string $currency): string
    {
        if (! is_numeric($amount) || (float) $amount <= 0) {
            throw new PaymentGatewayException('مبلغ الدفع غير صالح لعملية PayPal.');
        }

        $precision = in_array(strtoupper($currency), ['HUF', 'JPY', 'TWD'], true) ? 0 : 2;

        return number_format((float) $amount, $precision, '.', '');
    }

    private function exchangeRate(string $sourceCurrency, string $targetCurrency): float
    {
        $rates = Cache::remember(
            'paypal.exchange-rates.'.strtoupper($sourceCurrency),
            now()->addHours(6),
            function () use ($sourceCurrency): array {
                try {
                    $response = Http::acceptJson()
                        ->timeout(self::TIMEOUT)
                        ->get('https://open.er-api.com/v6/latest/'.rawurlencode($sourceCurrency));
                } catch (ConnectionException $exception) {
                    throw new PaymentGatewayException('تعذّر الاتصال بخدمة أسعار العملات، حاول مرة أخرى لاحقاً.', previous: $exception);
                }

                $body = $response->json();
                if ($response->failed() || ! is_array($body) || ($body['result'] ?? null) !== 'success' || ! is_array($body['rates'] ?? null)) {
                    throw new PaymentGatewayException('تعذّر الحصول على سعر تحويل العملات حالياً. حاول مرة أخرى لاحقاً.');
                }

                return $body['rates'];
            },
        );

        $rate = $rates[strtoupper($targetCurrency)] ?? null;
        if (! is_numeric($rate) || (float) $rate <= 0) {
            throw new PaymentGatewayException('لا يتوفر سعر تحويل لهذه العملة حالياً. اختر عملة أخرى.');
        }

        return (float) $rate;
    }
}
