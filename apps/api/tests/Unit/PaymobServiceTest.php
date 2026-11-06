<?php

namespace Tests\Unit;

use App\Services\Payments\Exceptions\PaymentGatewayException;
use App\Services\Payments\PaymobService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PaymobServiceTest extends TestCase
{
    private array $config = [
        'environment' => 'test',
        'api_key' => 'test-api-key',
        'integration_id' => 12345,
        'iframe_id' => '67890',
        'hmac_secret' => 'test-hmac-secret',
        'currency' => 'EGP',
    ];

    public function test_it_creates_a_hosted_card_payment_link(): void
    {
        Http::fake([
            'accept.paymob.com/api/auth/tokens' => Http::response(['token' => 'auth-token']),
            'accept.paymob.com/api/ecommerce/orders' => Http::response(['id' => 987]),
            'accept.paymob.com/api/acceptance/payment_keys' => Http::response(['token' => 'payment-token']),
        ]);

        $result = app(PaymobService::class)->createPaymentLink(
            $this->config,
            'COURSE-REFERENCE',
            '385.00',
            'EGP',
            [
                'first_name' => 'Test',
                'last_name' => 'Student',
                'email' => 'student@example.com',
                'phone' => '01012345678',
                'country' => 'EG',
            ],
            'https://tenant.example/api/v1/payments/paymob/webhook',
            'https://tenant.example/api/v1/payments/paymob/return?reference=COURSE-REFERENCE',
        );

        $this->assertSame('987', $result['order_id']);
        $this->assertSame(
            'https://accept.paymob.com/api/acceptance/iframes/67890?payment_token=payment-token',
            $result['url'],
        );
        Http::assertSent(fn (Request $request): bool => str_ends_with($request->url(), '/api/ecommerce/orders')
            && $request['amount_cents'] === 38500
            && $request['merchant_order_id'] === 'COURSE-REFERENCE'
        );
        Http::assertSent(fn (Request $request): bool => str_ends_with($request->url(), '/api/acceptance/payment_keys')
            && $request['integration_id'] === 12345
            && $request['notification_url'] === 'https://tenant.example/api/v1/payments/paymob/webhook'
            && $request['redirection_url'] === 'https://tenant.example/api/v1/payments/paymob/return?reference=COURSE-REFERENCE'
        );
    }

    public function test_it_converts_quoted_prices_to_the_paymob_integration_currency(): void
    {
        $service = app(PaymobService::class);
        $config = [
            ...$this->config,
            'currency' => 'USD',
            'exchange_rate' => 52,
            'exchange_rates' => ['SAR' => 14.2],
        ];

        $this->assertSame(
            ['amount' => '7.40', 'currency' => 'USD'],
            $service->amountForPayment($config, '385.00', 'EGP'),
        );
        $this->assertSame(
            ['amount' => '710.00', 'currency' => 'USD'],
            $service->amountForPayment($config, '50.00', 'SAR'),
        );
    }

    public function test_it_rejects_a_missing_currency_conversion_rate(): void
    {
        $this->expectException(PaymentGatewayException::class);

        app(PaymobService::class)->amountForPayment($this->config, '100.00', 'SAR');
    }

    public function test_it_verifies_the_signed_transaction_callback_and_rejects_tampering(): void
    {
        $payload = [
            'amount_cents' => '38500',
            'created_at' => '2026-11-06T15:00:00.000000',
            'currency' => 'EGP',
            'error_occured' => 'false',
            'has_parent_transaction' => 'false',
            'id' => 'transaction-123',
            'integration_id' => '12345',
            'is_3d_secure' => 'true',
            'is_auth' => 'false',
            'is_capture' => 'true',
            'is_refunded' => 'false',
            'is_standalone_payment' => 'true',
            'is_voided' => 'false',
            'order' => ['id' => 987],
            'owner' => '12345',
            'pending' => 'false',
            'source_data' => [
                'pan' => '2346',
                'sub_type' => 'Visa',
                'type' => 'card',
            ],
            'success' => 'true',
        ];
        $signingString = implode('', [
            '38500',
            '2026-11-06T15:00:00.000000',
            'EGP',
            'false',
            'false',
            'transaction-123',
            '12345',
            'true',
            'false',
            'true',
            'false',
            'true',
            'false',
            '987',
            '12345',
            'false',
            '2346',
            'Visa',
            'card',
            'true',
        ]);
        $hmac = hash_hmac('sha512', $signingString, $this->config['hmac_secret']);
        $service = app(PaymobService::class);

        $this->assertTrue($service->verifyCallback($payload, $hmac, $this->config['hmac_secret']));
        $this->assertFalse($service->verifyCallback(
            [...$payload, 'amount_cents' => '1'],
            $hmac,
            $this->config['hmac_secret'],
        ));
    }
}
