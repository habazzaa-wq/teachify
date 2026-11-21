<?php

namespace App\Http\Controllers\Api\v1\Payments;

use App\Http\Controllers\Controller;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Models\WalletPayment;
use App\Services\Commerce\DirectCoursePaymentService;
use App\Services\Payments\Exceptions\PaymentGatewayException;
use App\Services\Payments\FawaterkService;
use App\Services\Payments\PaymentGatewayService;
use App\Services\Wallet\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FawaterkWebhookController extends Controller
{
    public function __construct(
        private readonly FawaterkService $fawaterkService,
        private readonly PaymentGatewayService $gatewayService,
        private readonly WalletService $walletService,
        private readonly DirectCoursePaymentService $directCoursePaymentService,
    ) {}

    /**
     * Handle a Fawaterk payment-status webhook (JSON variant, URL ends with _json).
     */
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->input();

        if (! is_array($payload)) {
            return response()->json(['message' => 'Bad request'], 400);
        }

        $payment = $this->resolvePayment($payload);

        if (! $payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        // Webhooks are cross-tenant: bind the payment's tenant so that
        // TenantScope-driven queries (wallet, transactions) work correctly.
        app()->instance(Tenant::class, $payment->tenant);
        app()->instance('currentTenant', $payment->tenant);

        $config = $this->gatewayService->config($payment->tenant, PaymentGatewayService::PROVIDER, false);

        if (! $config) {
            return response()->json(['message' => 'Gateway not configured'], 422);
        }

        if (! $this->fawaterkService->verifyWebhookHash($payload, (string) $config['secret_key'])) {
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        // Never let a late failure notification overwrite a completed payment.
        if ($payment->isPaid()) {
            return response()->json(['message' => 'ok']);
        }

        $status = strtolower((string) (
            $payload['invoice_status']
            ?? $payload['status']
            ?? ($payload['response']['gatewayCode'] ?? '')
        ));

        if ($status === 'paid') {
            $invoiceId = (string) ($payload['invoice_id'] ?? $payment->provider_invoice_id ?? '');
            if ($invoiceId === ''
                || ($payment->provider_invoice_id !== null && $invoiceId !== (string) $payment->provider_invoice_id)) {
                return response()->json(['message' => 'Payment mismatch'], 422);
            }

            $embeddedReference = $this->extractEmbeddedReference($payload);
            if ($embeddedReference !== null && $embeddedReference !== $payment->reference) {
                return response()->json(['message' => 'Payment mismatch'], 422);
            }

            try {
                $invoice = $this->fawaterkService->invoiceData($config, $invoiceId);
            } catch (PaymentGatewayException $exception) {
                return response()->json(['message' => $exception->getMessage()], 502);
            }

            $invoiceAmount = $invoice['total'] ?? $invoice['amount'] ?? $invoice['invoice_amount'] ?? null;
            $invoiceCurrency = $this->normalizeCurrency((string) (
                $invoice['currency'] ?? $invoice['paidCurrency'] ?? ''
            ));
            $expectedCurrency = $this->normalizeCurrency((string) $payment->currency);

            if (! is_numeric($invoiceAmount)
                || abs((float) $invoiceAmount - (float) $payment->amount) > 0.01
                || $invoiceCurrency === ''
                || $invoiceCurrency !== $expectedCurrency
                || (array_key_exists('paid', $invoice) && ! filter_var($invoice['paid'], FILTER_VALIDATE_BOOLEAN))) {
                return response()->json(['message' => 'Payment amount or currency mismatch'], 422);
            }

            if ($payment->payment_type === 'course_purchase') {
                $this->directCoursePaymentService->complete($payment->tenant, $payment);
            } elseif ($payment->payment_type === 'wallet_topup') {
                $this->walletService->creditOnlinePayment($payment->tenant, $payment);
            } else {
                return response()->json(['message' => 'Unsupported payment type'], 422);
            }

            return response()->json(['message' => 'ok']);
        }

        if (in_array($status, ['failed', 'cancelled', 'expired', 'declined'], true)) {
            $reportedAmount = $payload['amount'] ?? null;
            $reportedCurrency = $this->normalizeCurrency((string) ($payload['paidCurrency'] ?? $payload['currency'] ?? ''));
            $expectedCurrency = $this->normalizeCurrency((string) $payment->currency);

            if ($reportedAmount !== null
                && (! is_numeric($reportedAmount)
                    || abs((float) $reportedAmount - (float) $payment->amount) > 0.01
                    || ($reportedCurrency !== '' && $reportedCurrency !== $expectedCurrency))) {
                return response()->json(['message' => 'Payment amount or currency mismatch'], 422);
            }

            if ($payment->payment_type === 'course_purchase') {
                $payment->update([
                    'status' => WalletPayment::STATUS_FAILED,
                    'failure_reason' => 'تم رفض الدفع أو انتهت صلاحيته.',
                ]);
            }
        }

        return response()->json(['message' => 'ok']);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function resolvePayment(array $payload): ?WalletPayment
    {
        $query = WalletPayment::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('provider', 'fawaterk');

        $reference = (string) ($this->extractEmbeddedReference($payload) ?? '');
        if ($reference !== '') {
            $payment = (clone $query)->where('reference', $reference)->first();
            if ($payment) {
                return $payment;
            }
        }

        $invoiceId = $payload['invoice_id'] ?? null;
        $invoiceKey = $payload['invoice_key'] ?? null;

        if ($invoiceId === null && $invoiceKey === null) {
            return null;
        }

        $fallback = clone $query;
        if ($invoiceId !== null) {
            $fallback->where('provider_invoice_id', (string) $invoiceId);
        }
        if (is_string($invoiceKey) && $invoiceKey !== '') {
            $fallback->where('provider_invoice_key', $invoiceKey);
        }

        return $fallback->orderByDesc('id')->first();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function extractEmbeddedReference(array $payload): ?string
    {
        $raw = $payload['pay_load'] ?? $payload['payLoad'] ?? $payload['reference'] ?? null;

        if (is_array($raw)) {
            foreach (['reference', 'merchant_reference', 'merchantReference'] as $key) {
                if (isset($raw[$key]) && is_string($raw[$key]) && $raw[$key] !== '') {
                    return $raw[$key];
                }
            }

            return null;
        }

        if (! is_string($raw) || $raw === '') {
            return null;
        }

        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            foreach (['reference', 'merchant_reference', 'merchantReference'] as $key) {
                if (isset($decoded[$key]) && is_string($decoded[$key]) && $decoded[$key] !== '') {
                    return $decoded[$key];
                }
            }

            return null;
        }

        return str_starts_with($raw, 'WALLET-') || str_starts_with($raw, 'COURSE-') ? $raw : null;
    }

    private function normalizeCurrency(string $currency): string
    {
        $currency = strtoupper(trim($currency));

        return $currency === 'SR' ? 'SAR' : $currency;
    }
}
