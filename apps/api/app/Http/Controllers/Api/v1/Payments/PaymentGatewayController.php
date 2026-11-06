<?php

namespace App\Http\Controllers\Api\v1\Payments;

use App\Http\Controllers\Controller;
use App\Services\Payments\Exceptions\PaymentGatewayException;
use App\Services\Payments\PaymentGatewayService;
use App\Services\Payments\PayPalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class PaymentGatewayController extends Controller
{
    public function __construct(
        private readonly PaymentGatewayService $gatewayService,
        private readonly PayPalService $paypalService,
    ) {}

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

    public function available(): JsonResponse
    {
        return response()->json([
            'data' => $this->gatewayService->activeProviders(currentTenant()),
        ]);
    }

    /**
     * Update the tenant's payment gateway settings.
     */
    public function update(Request $request): JsonResponse
    {
        Gate::authorize('payment-gateway.manage');

        $provider = $request->validate([
            'provider' => ['required', 'string', 'in:fawaterk,paypal'],
        ])['provider'];

        $rules = [
            'environment' => ['sometimes', 'string', 'in:test,live'],
            'is_active' => ['sometimes', 'boolean'],
        ];
        if ($provider === 'paypal') {
            $rules['client_id'] = ['nullable', 'string', 'max:255'];
            $rules['client_secret'] = ['nullable', 'string', 'max:255'];
            $rules['currency'] = ['sometimes', 'string', 'in:USD,EUR,GBP,SAR,AED,CAD,AUD'];
            $rules['exchange_rate'] = ['sometimes', 'nullable', 'numeric', 'gt:0', 'max:1000'];
            $rules['exchange_rates'] = ['sometimes', 'array:KWD,QAR,BHD'];
            foreach (['KWD', 'QAR', 'BHD'] as $currency) {
                $rules["exchange_rates.{$currency}"] = ['nullable', 'numeric', 'gt:0', 'max:1000'];
            }
        } else {
            $rules['api_key'] = ['nullable', 'string', 'max:255'];
            $rules['secret_key'] = ['nullable', 'string', 'max:255'];
        }

        $validated = $request->validate($rules);
        $settings = $this->gatewayService->rawSettings(currentTenant());
        $currentGateway = $settings['gateways'][$provider] ?? [];
        $credentialKeys = $provider === 'paypal'
            ? ['client_id', 'client_secret']
            : ['api_key', 'secret_key'];
        foreach ($credentialKeys as $key) {
            if (array_key_exists($key, $validated)
                && ($validated[$key] === null || trim((string) $validated[$key]) === '')) {
                unset($validated[$key]);
            }
        }
        if ($provider === 'paypal' && isset($validated['exchange_rates'])) {
            $validated['exchange_rates'] = array_merge(
                $currentGateway['exchange_rates'] ?? [],
                array_filter($validated['exchange_rates'], fn ($rate): bool => $rate !== null),
            );
        }
        $merged = array_merge($currentGateway, $validated);

        if ($provider === 'paypal' && ! empty($merged['is_active'])) {
            if (empty($merged['exchange_rate']) || empty($merged['currency'])) {
                throw ValidationException::withMessages([
                    'exchange_rate' => ['حدد عملة استقبال مدعومة وسعر التحويل من الجنيه المصري قبل تفعيل PayPal.'],
                ]);
            }
            try {
                $this->paypalService->verifyCredentials([
                    'environment' => $merged['environment'] ?? 'test',
                    'client_id' => $merged['client_id'] ?? '',
                    'client_secret' => $merged['client_secret'] ?? '',
                ]);
            } catch (PaymentGatewayException $exception) {
                throw ValidationException::withMessages([
                    'client_id' => [$exception->getMessage()],
                ]);
            }
        }
        if ($provider === 'fawaterk' && ! empty($merged['is_active']) && empty($merged['api_key'])) {
            throw ValidationException::withMessages([
                'api_key' => ['أدخل مفتاح API الخاص بفواتيرك قبل تفعيل البوابة.'],
            ]);
        }

        $payload = $this->gatewayService->save(currentTenant(), $provider, $validated);

        return response()->json([
            'message' => 'تم حفظ إعدادات بوابة الدفع بنجاح.',
            'data' => $payload,
        ]);
    }
}
