<?php

namespace App\Http\Controllers\Api\v1\Payments;

use App\Http\Controllers\Controller;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Models\WalletPayment;
use App\Services\Commerce\DirectCoursePaymentService;
use App\Services\Payments\PaymentGatewayService;
use App\Services\Payments\PaymobService;
use App\Services\Wallet\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PaymobWebhookController extends Controller
{
    public function __construct(
        private readonly PaymentGatewayService $gatewayService,
        private readonly PaymobService $paymobService,
        private readonly WalletService $walletService,
        private readonly DirectCoursePaymentService $directCoursePaymentService,
    ) {}

    public function handle(Request $request): JsonResponse
    {
        $payment = $this->process($request);

        return response()->json(['message' => $payment ? 'ok' : 'ignored']);
    }

    public function redirect(Request $request): RedirectResponse
    {
        $payment = $this->process($request);
        abort_unless($payment, 404, 'عملية الدفع غير موجودة.');

        $path = $payment->payment_type === 'course_purchase'
            ? '/course-payment/result'
            : '/wallet/recharge-result';

        return redirect(
            $request->schemeAndHttpHost().$path.'?reference='.rawurlencode($payment->reference),
        );
    }

    private function process(Request $request): ?WalletPayment
    {
        $payload = $request->input('obj');
        if (! is_array($payload)) {
            $payload = $request->all();
            unset($payload['hmac']);
        }

        if (! is_array($payload) || $payload === []) {
            abort(400, 'إشعار دفع غير صالح.');
        }

        $order = $payload['order'] ?? [];
        $reference = (string) (
            (is_array($order) ? ($order['merchant_order_id'] ?? '') : '')
            ?: ($payload['merchant_order_id'] ?? $request->query('reference', ''))
        );
        $orderId = (string) (is_array($order) ? ($order['id'] ?? '') : $order);

        $query = WalletPayment::query()->withoutGlobalScope(TenantScope::class);
        $payment = $reference !== ''
            ? $query->where('reference', $reference)->first()
            : null;

        if (! $payment && $orderId !== '') {
            $payment = WalletPayment::query()
                ->withoutGlobalScope(TenantScope::class)
                ->where('provider', 'paymob')
                ->where('provider_invoice_id', $orderId)
                ->first();
        }

        if (! $payment || $payment->provider !== 'paymob') {
            abort(404, 'عملية الدفع غير موجودة.');
        }
        $reference = $reference !== '' ? $reference : $payment->reference;

        app()->instance(Tenant::class, $payment->tenant);
        app()->instance('currentTenant', $payment->tenant);

        $config = $this->gatewayService->config($payment->tenant, 'paymob', false);
        $hmac = (string) ($request->query('hmac') ?? $request->input('hmac', ''));
        if (! $config || ! $this->paymobService->verifyCallback(
            $payload,
            $hmac,
            (string) ($config['hmac_secret'] ?? ''),
        )) {
            abort(401, 'توقيع إشعار Paymob غير صالح.');
        }

        $expectedAmount = (string) ($payment->metadata['gateway_amount'] ?? $payment->amount);
        $expectedCurrency = strtoupper((string) ($payment->metadata['gateway_currency'] ?? $payment->currency));
        $amountCents = filter_var($payload['amount_cents'] ?? null, FILTER_VALIDATE_INT);
        $transactionOrderId = (string) (is_array($order) ? ($order['id'] ?? '') : $order);

        if ($reference !== $payment->reference
            || $transactionOrderId === ''
            || $transactionOrderId !== (string) $payment->provider_invoice_id
            || empty($payload['id'])
            || $amountCents === false
            || $amountCents !== (int) round((float) $expectedAmount * 100)
            || strtoupper((string) ($payload['currency'] ?? '')) !== $expectedCurrency
            || (int) ($payload['integration_id'] ?? 0) !== $config['integration_id']) {
            abort(422, 'بيانات عملية الدفع لا تطابق الطلب.');
        }

        if ($payment->isPaid()) {
            return $payment;
        }

        if ($this->isTrue($payload['success'] ?? false)
            && ! $this->isTrue($payload['pending'] ?? false)
            && ! $this->isTrue($payload['error_occured'] ?? false)
            && ! $this->isTrue($payload['is_voided'] ?? false)
            && ! $this->isTrue($payload['is_refunded'] ?? $payload['is_refund'] ?? false)) {
            $payment->update([
                'provider_reference' => (string) ($payload['id'] ?? ''),
            ]);

            if ($payment->payment_type === 'course_purchase') {
                $this->directCoursePaymentService->complete($payment->tenant, $payment);
            } elseif ($payment->payment_type === 'wallet_topup') {
                $this->walletService->creditOnlinePayment($payment->tenant, $payment);
            } else {
                abort(422, 'نوع عملية الدفع غير مدعوم.');
            }
        } elseif (! $this->isTrue($payload['pending'] ?? false)) {
            $payment->update([
                'status' => WalletPayment::STATUS_FAILED,
                'failure_reason' => 'لم يؤكد Paymob نجاح عملية الدفع.',
            ]);
        }

        return $payment;
    }

    private function isTrue(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
