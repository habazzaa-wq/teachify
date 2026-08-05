<?php

namespace App\Http\Controllers\Api\v1\Wallet;

use App\Http\Controllers\Controller;
use App\Models\TenantUser;
use App\Models\Wallet;
use App\Models\WalletPayment;
use App\Services\Payments\FawaterkService;
use App\Services\Payments\PaymentGatewayService;
use App\Services\Wallet\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class WalletController extends Controller
{
    public function __construct(
        private readonly WalletService $walletService,
        private readonly PaymentGatewayService $gatewayService,
        private readonly FawaterkService $fawaterkService,
    ) {
    }

    /**
     * Ensure the active membership has the student role so a teacher/owner
     * token can never read or create a wallet via the student endpoints.
     */
    private function assertStudentRole(TenantUser $membership): void
    {
        abort_unless(
            $membership->roles()->where('slug', 'student')->exists(),
            403,
            'هذه الميزة متاحة للطلاب فقط.',
        );
    }

    /**
     * Show the current student's wallet (creates it on first access).
     */
    public function me(): JsonResponse
    {
        $tenant = currentTenant();
        $membership = app(TenantUser::class);
        $this->assertStudentRole($membership);

        $wallet = $this->walletService->getOrCreateWallet($tenant, $membership);

        return response()->json([
            'data' => $this->walletPayload($wallet),
        ]);
    }

    /**
     * List the current student's wallet transactions.
     */
    public function transactions(Request $request): JsonResponse
    {
        $tenant = currentTenant();
        $membership = app(TenantUser::class);
        $this->assertStudentRole($membership);

        $wallet = $this->walletService->getOrCreateWallet($tenant, $membership);

        $items = $wallet->transactions()
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 20));

        return response()->json([
            'data' => $items->items(),
            'total' => $items->total(),
            'per_page' => $items->perPage(),
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
        ]);
    }

    /**
     * Recharge the wallet using a recharge code.
     */
    public function recharge(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:64'],
        ]);

        $tenant = currentTenant();
        $membership = app(TenantUser::class);
        $this->assertStudentRole($membership);

        $result = $this->walletService->recharge($tenant, $membership, $validated['code']);

        return response()->json([
            'message' => 'تم شحن محفظتك بنجاح بمبلغ ' . rtrim(rtrim(number_format((float) $result['amount'], 2), '0'), '.') . ' جنيه.',
            'data' => [
                'amount' => $result['amount'],
                'balance' => $result['balance'],
                'wallet' => $this->walletPayload($result['wallet']),
                'transaction' => $result['transaction'],
            ],
        ]);
    }

    /**
     * Create an online wallet top-up (Fawaterk invoice link) and return the payment URL.
     */
    public function createOnlinePayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:1000000'],
        ]);

        $tenant = currentTenant();
        $membership = app(TenantUser::class);
        $this->assertStudentRole($membership);
        $wallet = $this->walletService->getOrCreateWallet($tenant, $membership);
        $amount = (float) $validated['amount'];

        $config = $this->gatewayService->requireConfig($tenant);

        $reference = $this->gatewayService->generateReference();

        $payment = WalletPayment::create([
            'tenant_id' => $tenant->id,
            'wallet_id' => $wallet->id,
            'tenant_user_id' => $membership->id,
            'reference' => $reference,
            'amount' => $amount,
            'currency' => 'EGP',
            'status' => WalletPayment::STATUS_PENDING,
            'provider' => PaymentGatewayService::PROVIDER,
            'metadata' => ['requested_by_ip' => $request->ip()],
        ]);

        $user = $membership->user;
        $fullName = $user?->name ?? $membership->phone ?? '';
        $nameParts = array_values(array_filter(array_map('trim', explode(' ', (string) $fullName))));

        $baseUrl = $request->schemeAndHttpHost();

        $payload = [
            'cartTotal' => $amount,
            'currency' => 'EGP',
            'customer' => [
                'first_name' => $nameParts[0] ?? 'طالب',
                'last_name' => $nameParts[1] ?? '',
                'email' => $user?->email,
                'phone' => $membership->phone,
            ],
            'cartItems' => [
                [
                    'name' => 'شحن محفظة الأكاديمية',
                    'price' => (string) $amount,
                    'quantity' => '1',
                ],
            ],
            'sendEmail' => false,
            'sendSMS' => false,
            'payLoad' => ['reference' => $reference],
            'redirectionUrls' => [
                'successUrl' => $baseUrl . '/wallet/recharge-result?reference=' . $reference . '&status=success',
                'failUrl' => $baseUrl . '/wallet/recharge-result?reference=' . $reference . '&status=failed',
                'pendingUrl' => $baseUrl . '/wallet/recharge-result?reference=' . $reference . '&status=pending',
                'webhookUrl' => $baseUrl . '/api/v1/payments/fawaterk/webhook_json',
            ],
        ];

        try {
            $result = $this->fawaterkService->createInvoiceLink($config, $payload);
        } catch (\App\Services\Payments\Exceptions\PaymentGatewayException $e) {
            $payment->update([
                'status' => WalletPayment::STATUS_FAILED,
                'failure_reason' => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'amount' => [$e->getMessage()],
            ]);
        }

        if ($result['url'] === '') {
            $payment->update([
                'status' => WalletPayment::STATUS_FAILED,
                'failure_reason' => 'لم ترجع بوابة الدفع رابط دفع صالح.',
            ]);

            throw ValidationException::withMessages([
                'amount' => ['تعذر إنشاء رابط الدفع، حاول مرة أخرى.'],
            ]);
        }

        $payment->update([
            'provider_invoice_id' => $result['invoice_id'] !== null ? (string) $result['invoice_id'] : null,
            'provider_invoice_key' => $result['invoice_key'],
            'provider_payment_url' => $result['url'],
        ]);

        return response()->json([
            'message' => 'تم إنشاء رابط الدفع بنجاح.',
            'data' => [
                'reference' => $reference,
                'payment_url' => $result['url'],
                'amount' => $amount,
                'currency' => 'EGP',
            ],
        ], 201);
    }

    /**
     * Get the status of one of the current user's online payments.
     */
    public function onlinePaymentStatus(string $reference): JsonResponse
    {
        $tenant = currentTenant();
        $membership = app(TenantUser::class);
        $this->assertStudentRole($membership);

        $payment = WalletPayment::query()
            ->where('tenant_id', $tenant->id)
            ->where('reference', $reference)
            ->where('tenant_user_id', $membership->id)
            ->first();

        if (! $payment) {
            abort(404, 'عملية الدفع غير موجودة.');
        }

        return response()->json([
            'data' => [
                'reference' => $payment->reference,
                'status' => $payment->status,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
                'failure_reason' => $payment->failure_reason,
                'paid_at' => $payment->paid_at?->toIso8601String(),
                'wallet_balance' => (float) $payment->wallet->balance,
            ],
        ]);
    }

    private function walletPayload(Wallet $wallet): array
    {
        return [
            'id' => $wallet->id,
            'tenant_id' => $wallet->tenant_id,
            'tenant_user_id' => $wallet->tenant_user_id,
            'balance' => (float) $wallet->balance,
            'currency' => $wallet->currency,
            'updated_at' => $wallet->updated_at?->toIso8601String(),
        ];
    }
}