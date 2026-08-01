<?php

namespace App\Services\Payments;

use App\Services\Payments\Exceptions\PaymentGatewayException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Thin HTTP client for the Fawaterk (فواتيرك) payment gateway.
 *
 * Docs: https://fawaterak-api.readme.io/
 */
class FawaterkService
{
    public const PROVIDER = 'fawaterk';

    private const STAGING_BASE_URL = 'https://staging.fawaterk.com/api/v2';

    private const PRODUCTION_BASE_URL = 'https://app.fawaterk.com/api/v2';

    private const TIMEOUT = 30;

    /**
     * Create an invoice link that the customer can be redirected to.
     *
     * @param  array<string, mixed>  $config  resolved gateway config
     * @param  array<string, mixed>  $payload
     * @return array{url: string, invoice_id: int|string|null, invoice_key: string|null}
     *
     * @throws PaymentGatewayException
     */
    public function createInvoiceLink(array $config, array $payload): array
    {
        $apiKey = (string) ($config['api_key'] ?? '');

        if ($apiKey === '') {
            throw new PaymentGatewayException('مفتاح API الخاص ببوابة الدفع غير مُعدّ بعد.');
        }

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->asJson()
                ->timeout(self::TIMEOUT)
                ->post($this->baseUrl($config).'/createInvoiceLink', $payload);
        } catch (ConnectionException $e) {
            throw new PaymentGatewayException('تعذّر الاتصال ببوابة الدفع، حاول مرة أخرى لاحقاً.', previous: $e);
        } catch (Throwable $e) {
            throw new PaymentGatewayException('خطأ في الاتصال ببوابة الدفع.', previous: $e);
        }

        return $this->parseInvoiceResponse($response);
    }

    /**
     * Validate a webhook payload using its hashKey (HMAC-SHA256 with the vendor/secret key).
     *
     * @param  array<string, mixed>  $data
     */
    public function verifyWebhookHash(array $data, string $secretKey): bool
    {
        if ($secretKey === '') {
            return false;
        }

        $expected = (string) ($data['hashKey'] ?? '');
        if ($expected === '') {
            return false;
        }

        if (isset($data['invoice_id'])) {
            $queryParam = 'InvoiceId='.$data['invoice_id']
                .'&InvoiceKey='.($data['invoice_key'] ?? '')
                .'&PaymentMethod='.($data['payment_method'] ?? '');
        } else {
            $queryParam = 'referenceId='.($data['referenceId'] ?? '')
                .'&PaymentMethod='.($data['paymentMethod'] ?? '');
        }

        $hash = hash_hmac('sha256', $queryParam, $secretKey, false);

        return hash_equals($hash, $expected);
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function baseUrl(array $config): string
    {
        return ($config['environment'] ?? 'test') === 'live'
            ? self::PRODUCTION_BASE_URL
            : self::STAGING_BASE_URL;
    }

    /**
     * @return array{url: string, invoice_id: int|string|null, invoice_key: string|null}
     *
     * @throws PaymentGatewayException
     */
    private function parseInvoiceResponse(Response $response): array
    {
        $body = $response->json();

        if (! is_array($body) || ($body['status'] ?? '') !== 'success') {
            $message = is_array($body)
                ? (string) ($body['message'] ?? ($body['errors'] ?? null) ? json_encode($body['errors']) : 'فشل إنشاء رابط الدفع.')
                : $response->reason();

            throw new PaymentGatewayException('بوابة الدفع رفضت الطلب: '.$message);
        }

        $data = is_array($body['data'] ?? null) ? $body['data'] : [];

        return [
            'url' => (string) ($data['url'] ?? ''),
            'invoice_id' => $data['invoiceId'] ?? null,
            'invoice_key' => isset($data['invoiceKey']) ? (string) $data['invoiceKey'] : null,
        ];
    }
}
