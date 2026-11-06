<?php

namespace App\Http\Controllers\Api\v1\Payments;

use App\Http\Controllers\Controller;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Models\WalletPayment;
use App\Services\Commerce\DirectCoursePaymentService;
use App\Services\Payments\Exceptions\PaymentGatewayException;
use App\Services\Payments\PaymentGatewayService;
use App\Services\Payments\PayPalService;
use App\Services\Wallet\WalletService;
use Illuminate\Http\Request;

class PayPalReturnController extends Controller
{
    public function __construct(
        private readonly PaymentGatewayService $gatewayService,
        private readonly PayPalService $paypalService,
        private readonly WalletService $walletService,
        private readonly DirectCoursePaymentService $directCoursePaymentService,
    ) {}

    public function complete(Request $request)
    {
        $reference = (string) $request->query('reference', '');
        $payment = $this->findPayment($reference);

        if (! $payment || $payment->provider !== 'paypal') {
            abort(404, 'عملية الدفع غير موجودة.');
        }

        $resultUrl = $this->resultUrl($request, $payment);

        if ($payment->isPaid()) {
            return redirect($resultUrl);
        }

        $orderId = (string) $request->query('token', '');
        if ($orderId === '' || $orderId !== (string) $payment->provider_invoice_id) {
            return redirect($resultUrl);
        }

        app()->instance(Tenant::class, $payment->tenant);
        app()->instance('currentTenant', $payment->tenant);

        try {
            $config = $this->gatewayService->requireConfig($payment->tenant, 'paypal', false);
            $capture = $this->paypalService->captureOrder(
                $config,
                $orderId,
                $payment->reference,
                (string) ($payment->metadata['paypal_amount'] ?? $payment->amount),
                (string) ($payment->metadata['paypal_currency'] ?? $payment->currency),
            );
        } catch (PaymentGatewayException $exception) {
            $payment->update([
                'status' => WalletPayment::STATUS_FAILED,
                'failure_reason' => $exception->getMessage(),
            ]);

            return redirect($resultUrl);
        }

        $payment->update(['provider_reference' => $capture['capture_id']]);

        if ($payment->payment_type === 'course_purchase') {
            $this->directCoursePaymentService->complete($payment->tenant, $payment);
        } elseif ($payment->payment_type === 'wallet_topup') {
            $this->walletService->creditOnlinePayment($payment->tenant, $payment);
        } else {
            $payment->update([
                'status' => WalletPayment::STATUS_FAILED,
                'failure_reason' => 'نوع عملية الدفع غير مدعوم.',
            ]);
        }

        return redirect($resultUrl);
    }

    public function cancel(Request $request)
    {
        $payment = $this->findPayment((string) $request->query('reference', ''));

        if (! $payment || $payment->provider !== 'paypal') {
            abort(404, 'عملية الدفع غير موجودة.');
        }

        if (! $payment->isPaid()) {
            $payment->update([
                'status' => WalletPayment::STATUS_FAILED,
                'failure_reason' => 'ألغى المستخدم عملية الدفع عبر PayPal.',
            ]);
        }

        return redirect($this->resultUrl($request, $payment));
    }

    private function findPayment(string $reference): ?WalletPayment
    {
        if ($reference === '') {
            return null;
        }

        return WalletPayment::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('reference', $reference)
            ->first();
    }

    private function resultUrl(Request $request, WalletPayment $payment): string
    {
        $path = $payment->payment_type === 'course_purchase'
            ? '/course-payment/result'
            : '/wallet/recharge-result';

        return $request->schemeAndHttpHost().$path.'?reference='.rawurlencode($payment->reference);
    }
}
