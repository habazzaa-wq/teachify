<?php

namespace Tests\Unit;

use App\Services\Payments\Exceptions\PaymentGatewayException;
use App\Services\Payments\PayPalService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class PayPalServiceTest extends TestCase
{
    private array $config = [
        'environment' => 'test',
        'client_id' => 'sandbox-client-id',
        'client_secret' => 'sandbox-client-secret',
    ];

    public function test_it_creates_paypal_orders_and_returns_the_approval_url(): void
    {
        Http::fake([
            'api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response(['access_token' => 'access-token']),
            'api-m.sandbox.paypal.com/v2/checkout/orders' => Http::response([
                'id' => 'ORDER-123',
                'links' => [['rel' => 'approve', 'href' => 'https://www.sandbox.paypal.com/checkoutnow?token=ORDER-123']],
            ]),
        ]);

        $result = app(PayPalService::class)->createOrder(
            $this->config,
            'WALLET-REFERENCE',
            '125.50',
            'EGP',
            'Wallet top-up',
            'https://tenant.example/api/v1/payments/paypal/return?reference=WALLET-REFERENCE',
            'https://tenant.example/api/v1/payments/paypal/cancel?reference=WALLET-REFERENCE',
        );

        $this->assertSame('ORDER-123', $result['order_id']);
        $this->assertSame(
            'https://www.sandbox.paypal.com/checkoutnow?token=ORDER-123',
            $result['url'],
        );
        Http::assertSent(fn (Request $request): bool => $request->url() === 'https://api-m.sandbox.paypal.com/v2/checkout/orders'
            && $request['purchase_units'][0]['custom_id'] === 'WALLET-REFERENCE'
            && $request['purchase_units'][0]['amount']['currency_code'] === 'EGP'
            && $request['purchase_units'][0]['amount']['value'] === '125.50'
        );
    }

    public function test_it_logs_paypal_order_diagnostics_without_exposing_them_in_the_exception(): void
    {
        Http::fake([
            'api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response(['access_token' => 'access-token']),
            'api-m.sandbox.paypal.com/v2/checkout/orders' => Http::response([
                'name' => 'UNPROCESSABLE_ENTITY',
                'debug_id' => 'paypal-debug-123',
                'details' => [[
                    'issue' => 'CURRENCY_NOT_SUPPORTED',
                    'description' => 'The currency is not supported.',
                ]],
            ], 422),
        ]);
        Log::shouldReceive('warning')
            ->once()
            ->withArgs(fn (string $message, array $context): bool => $message === 'PayPal API request failed.'
                && $context['operation'] === '/v2/checkout/orders'
                && $context['request_id'] === 'COURSE-REFERENCE'
                && $context['paypal_debug_id'] === 'paypal-debug-123'
                && $context['details'][0]['issue'] === 'CURRENCY_NOT_SUPPORTED');

        $this->expectException(PaymentGatewayException::class);
        $this->expectExceptionMessage('رفض PayPal طلب الدفع. تحقق من بيانات الحساب والعملة وحاول مرة أخرى.');

        app(PayPalService::class)->createOrder(
            $this->config,
            'COURSE-REFERENCE',
            '125.50',
            'USD',
            'Course purchase',
            'https://tenant.example/return',
            'https://tenant.example/cancel',
        );
    }

    public function test_it_returns_an_actionable_message_for_paypal_compliance_rejections(): void
    {
        Http::fake([
            'api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response(['access_token' => 'access-token']),
            'api-m.sandbox.paypal.com/v2/checkout/orders/ORDER-123/capture' => Http::response([
                'name' => 'UNPROCESSABLE_ENTITY',
                'debug_id' => 'sandbox-debug-123',
                'details' => [[
                    'issue' => 'COMPLIANCE_VIOLATION',
                    'description' => 'Transaction cannot be processed.',
                ]],
            ], 422),
        ]);
        Log::shouldReceive('warning')->once();

        $this->expectException(PaymentGatewayException::class);
        $this->expectExceptionMessageMatches('/COMPLIANCE_VIOLATION.*sandbox-debug-123/');

        app(PayPalService::class)->captureOrder(
            $this->config,
            'ORDER-123',
            'COURSE-REFERENCE',
            '7.22',
            'USD',
        );
    }

    public function test_it_rejects_a_capture_when_the_paid_amount_does_not_match(): void
    {
        Http::fake([
            'api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response(['access_token' => 'access-token']),
            'api-m.sandbox.paypal.com/v2/checkout/orders/ORDER-123/capture' => Http::response([
                'status' => 'COMPLETED',
                'purchase_units' => [[
                    'custom_id' => 'WALLET-REFERENCE',
                    'payments' => [
                        'captures' => [[
                            'id' => 'CAPTURE-123',
                            'status' => 'COMPLETED',
                            'amount' => ['currency_code' => 'EGP', 'value' => '10.00'],
                        ]],
                    ],
                ]],
            ]),
        ]);

        $this->expectException(PaymentGatewayException::class);

        app(PayPalService::class)->captureOrder(
            $this->config,
            'ORDER-123',
            'WALLET-REFERENCE',
            '125.50',
            'EGP',
        );
    }

    public function test_it_accepts_a_capture_only_when_paypal_confirms_the_expected_payment(): void
    {
        Http::fake([
            'api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response(['access_token' => 'access-token']),
            'api-m.sandbox.paypal.com/v2/checkout/orders/ORDER-123/capture' => Http::response([
                'status' => 'COMPLETED',
                'purchase_units' => [[
                    'custom_id' => 'WALLET-REFERENCE',
                    'payments' => [
                        'captures' => [[
                            'id' => 'CAPTURE-123',
                            'status' => 'COMPLETED',
                            'amount' => ['currency_code' => 'USD', 'value' => '2.51'],
                        ]],
                    ],
                ]],
            ]),
        ]);

        $result = app(PayPalService::class)->captureOrder(
            $this->config,
            'ORDER-123',
            'WALLET-REFERENCE',
            '2.51',
            'USD',
        );

        $this->assertSame('CAPTURE-123', $result['capture_id']);
        Http::assertSent(fn (Request $request): bool => $request->url() === 'https://api-m.sandbox.paypal.com/v2/checkout/orders/ORDER-123/capture'
            && $request->body() === '{}');
    }

    public function test_it_charges_supported_regional_currencies_without_conversion(): void
    {
        $service = app(PayPalService::class);
        $this->assertSame(
            ['amount' => '500.00', 'currency' => 'SAR', 'exchange_rate' => '1'],
            $service->amountForPayment('500', 'SR'),
        );
        $this->assertSame(
            ['amount' => '50.00', 'currency' => 'AED', 'exchange_rate' => '1'],
            $service->amountForPayment('50', 'AED'),
        );
    }

    public function test_it_converts_a_course_price_into_the_selected_paypal_currency(): void
    {
        Http::fake([
            'open.er-api.com/v6/latest/EGP' => Http::response([
                'result' => 'success',
                'rates' => ['USD' => 0.02],
            ]),
        ]);

        $result = app(PayPalService::class)->amountForPayment('385.00', 'EGP', 'USD');

        $this->assertSame([
            'amount' => '7.70',
            'currency' => 'USD',
            'exchange_rate' => '0.02',
        ], $result);
        Http::assertSent(fn (Request $request): bool => $request->url() === 'https://open.er-api.com/v6/latest/EGP');
    }

    public function test_it_rejects_a_selected_currency_that_paypal_does_not_support(): void
    {
        $this->expectException(PaymentGatewayException::class);
        app(PayPalService::class)->amountForPayment('385.00', 'EGP', 'EGP');
    }

    public function test_it_rounds_zero_decimal_paypal_currencies_correctly(): void
    {
        Http::fake([
            'open.er-api.com/v6/latest/USD' => Http::response([
                'result' => 'success',
                'rates' => ['JPY' => 150.25],
            ]),
        ]);

        $result = app(PayPalService::class)->amountForPayment('1.00', 'USD', 'JPY');

        $this->assertSame('150', $result['amount']);
    }
}
