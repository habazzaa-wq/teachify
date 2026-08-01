<?php

namespace App\Http\Controllers\Api\v1\Payments;

use App\Http\Controllers\Controller;
use App\Services\Payments\PaymentGatewayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PaymentGatewayController extends Controller
{
    public function __construct(private readonly PaymentGatewayService $gatewayService)
    {
    }

    /**
     * Get the tenant's payment gateway settings (masked).
     */
    public function show(): JsonResponse
    {
        $settings = $this->gatewayService->rawSettings(currentTenant());

        return response()->json([
            'data' => $this->gatewayService->publicPayload($settings),
        ]);
    }

    /**
     * Update the tenant's payment gateway settings.
     */
    public function update(Request $request): JsonResponse
    {
        Gate::authorize('payment-gateway.manage');

        $validated = $request->validate([
            'provider' => ['sometimes', 'string', 'in:fawaterk'],
            'environment' => ['sometimes', 'string', 'in:test,live'],
            'api_key' => ['nullable', 'string', 'max:255'],
            'secret_key' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $payload = $this->gatewayService->save(currentTenant(), $validated);

        return response()->json([
            'message' => 'تم حفظ إعدادات بوابة الدفع بنجاح.',
            'data' => $payload,
        ]);
    }
}
