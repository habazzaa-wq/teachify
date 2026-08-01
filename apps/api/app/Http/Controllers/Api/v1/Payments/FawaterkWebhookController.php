<?php

namespace App\Http\Controllers\Api\v1\Payments;

use App\Http\Controllers\Controller;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Models\WalletPayment;
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
    ) {
    }

    /**
     * Handle a Fawaterk payment-status webhook (JSON variant, URL ends with _json).
     */
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->input();

        // Payload is not JSON-ish; reject early.
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

        $config = $this->gatewayService->config($payment->tenant);

        // We must be able to verify the hash before trusting the webhook.
        if (! $config) {
            return response()->json(['message' => 'Gateway not configured'], 422);
        }

        if (! $this->fawaterkService->verifyWebhookHash($payload, (string) $config['secret_key'])) {
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        $status = strtolower((string) ($payload['invoice_status'] ?? ''));

        if ($status === 'paid') {
            $this->walletService->creditOnlinePayment($payment->tenant, $payment);
        }

        return response()->json(['message' => 'ok']);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function resolvePayment(array $payload): ?WalletPayment
    {
        // Prefer the reference we embedded in the payload when creating the invoice.
        $reference = (string) ($payload['payLoad']['reference'] ?? $payload['reference'] ?? '');

        if ($reference !== '') {
            $payment = WalletPayment::query()
                ->withoutGlobalScope(TenantScope::class)
                ->where('reference', $reference)
                ->first();

            if ($payment) {
                return $payment;
            }
        }

        $invoiceId = $payload['invoice_id'] ?? null;
        $invoiceKey = $payload['invoice_key'] ?? null;

        $query = WalletPayment::query()->withoutGlobalScope(TenantScope::class);

        if ($invoiceId !== null) {
            $query->where('provider_invoice_id', (string) $invoiceId);
        }

        if ($invoiceKey !== null && $invoiceKey !== '') {
            $query->where('provider_invoice_key', (string) $invoiceKey);
        }

        if ($invoiceId === null && $invoiceKey === null) {
            return null;
        }

        return $query->orderByDesc('id')->first();
    }
}
