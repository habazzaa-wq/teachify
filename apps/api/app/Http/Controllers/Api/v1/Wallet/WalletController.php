<?php

namespace App\Http\Controllers\Api\v1\Wallet;

use App\Http\Controllers\Controller;
use App\Models\TenantUser;
use App\Models\Wallet;
use App\Services\Wallet\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function __construct(private readonly WalletService $walletService)
    {
    }

    /**
     * Show the current student's wallet (creates it on first access).
     */
    public function me(): JsonResponse
    {
        $tenant = currentTenant();
        $membership = app(TenantUser::class);

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
