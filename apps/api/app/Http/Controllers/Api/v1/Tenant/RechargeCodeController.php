<?php

namespace App\Http\Controllers\Api\v1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\RechargeCode;
use App\Services\Wallet\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class RechargeCodeController extends Controller
{
    public function __construct(private readonly WalletService $walletService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('recharge-codes.manage');

        $query = RechargeCode::query()
            ->where('tenant_id', currentTenant()->id)
            ->with('createdBy:id,user_id');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', '%' . $search . '%')
                    ->orWhere('amount', 'like', '%' . $search . '%');
            });
        }

        if ($request->boolean('inactive', false)) {
            $query->where('is_active', false);
        }

        if ($request->boolean('active_only', false)) {
            $query->where('is_active', true);
        }

        $items = $query->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 50));

        return response()->json([
            'data' => $items->items(),
            'total' => $items->total(),
            'per_page' => $items->perPage(),
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('recharge-codes.manage');

        $validated = $request->validate([
            'code' => ['nullable', 'string', 'max:32'],
            'amount' => ['required', 'numeric', 'min:1', 'max:1000000'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $rechargeCode = $this->walletService->generate(
            currentTenant(),
            currentTenantUser() ?? abort(403, 'Active membership required.'),
            $validated,
        );

        return response()->json([
            'message' => 'تم إنشاء كود الشحن بنجاح.',
            'data' => $rechargeCode->load('createdBy:id,user_id'),
        ], 201);
    }

    public function show(RechargeCode $rechargeCode): JsonResponse
    {
        Gate::authorize('recharge-codes.manage');
        abort_if($rechargeCode->tenant_id !== currentTenant()->id, 404);

        return response()->json([
            'data' => $rechargeCode->load('createdBy:id,user_id'),
        ]);
    }

    public function update(Request $request, RechargeCode $rechargeCode): JsonResponse
    {
        Gate::authorize('recharge-codes.manage');
        abort_if($rechargeCode->tenant_id !== currentTenant()->id, 404);

        $validated = $request->validate([
            'code' => ['nullable', 'string', 'max:32'],
            'amount' => ['sometimes', 'numeric', 'min:1', 'max:1000000'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        // Only allow editing unused codes.
        if ($rechargeCode->used_count > 0) {
            unset($validated['amount']);
        }

        $data = $validated;
        if (array_key_exists('code', $data) && $data['code'] !== null && $data['code'] !== '') {
            $normalized = $this->walletService->normalizeCode((string) $data['code']);
            if ($normalized !== $rechargeCode->code && $this->walletService->exists(currentTenant(), $normalized)) {
                abort(422, 'كود الشحن مستخدم من قبل.');
            }
            $data['code'] = $normalized;
        } else {
            unset($data['code']);
        }

        if (array_key_exists('expires_at', $data) && $data['expires_at'] === null) {
            $data['expires_at'] = null;
        }

        $rechargeCode->update($data);

        return response()->json([
            'message' => 'تم تحديث كود الشحن بنجاح.',
            'data' => $rechargeCode->refresh()->load('createdBy:id,user_id'),
        ]);
    }

    public function destroy(RechargeCode $rechargeCode): JsonResponse
    {
        Gate::authorize('recharge-codes.manage');
        abort_if($rechargeCode->tenant_id !== currentTenant()->id, 404);

        $rechargeCode->delete();

        return response()->json(['message' => 'تم حذف كود الشحن بنجاح.']);
    }

    public function toggleStatus(RechargeCode $rechargeCode): JsonResponse
    {
        Gate::authorize('recharge-codes.manage');
        abort_if($rechargeCode->tenant_id !== currentTenant()->id, 404);

        $rechargeCode->update(['is_active' => ! $rechargeCode->is_active]);

        return response()->json([
            'message' => $rechargeCode->is_active ? 'تم تفعيل كود الشحن.' : 'تم إيقاف كود الشحن.',
            'data' => $rechargeCode->refresh(),
        ]);
    }

    /**
     * Generate a random recharge code with the given parameters.
     */
    public function generate(Request $request): JsonResponse
    {
        Gate::authorize('recharge-codes.manage');

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:1000000'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['sometimes', 'boolean'],
            'quantity' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $quantity = (int) ($validated['quantity'] ?? 1);
        $codes = [];

        for ($i = 0; $i < $quantity; $i++) {
            $codes[] = $this->walletService->generate(
                currentTenant(),
                currentTenantUser() ?? abort(403, 'Active membership required.'),
                $validated,
            )->load('createdBy:id,user_id');
        }

        return response()->json([
            'message' => "تم توليد {$quantity} " . ($quantity === 1 ? 'كود شحن' : 'أكواد شحن') . ' بنجاح.',
            'data' => $quantity === 1 ? $codes[0] : $codes,
        ], 201);
    }
}
