<?php

namespace Tests\Unit;

use App\Services\Payments\Exceptions\PaymentGatewayException;
use App\Services\Payments\PayPalService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
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
    }

    public function test_it_converts_egp_using_the_tenant_rate_and_normalizes_regional_currency_codes(): void
    {
        $service = app(PayPalService::class);
        $config = [
            ...$this->config,
            'currency' => 'USD',
            'exchange_rate' => 0.02,
            'exchange_rates' => ['KWD' => 3.25],
        ];

        $converted = $service->amountForPayment($config, '100.00', 'EGP');
        $regional = $service->amountForPayment($config, '50.00', 'SR');
        $convertedRegional = $service->amountForPayment($config, '1.00', 'KWD');

        $this->assertSame(['amount' => '2.00', 'currency' => 'USD'], $converted);
        $this->assertSame(['amount' => '50.00', 'currency' => 'SAR'], $regional);
        $this->assertSame(['amount' => '3.25', 'currency' => 'USD'], $convertedRegional);
    }

    public function test_it_converts_egp_when_the_rate_is_entered_as_egp_per_paypal_currency(): void
    {
        $converted = app(PayPalService::class)->amountForPayment([
            ...$this->config,
            'currency' => 'USD',
            'exchange_rate' => 52,
        ], '385.00', 'EGP');

        $this->assertSame(['amount' => '7.40', 'currency' => 'USD'], $converted);
    }
}
