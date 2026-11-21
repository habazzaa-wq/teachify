<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\TenantSetting;
use App\Models\TenantUser;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletPayment;
use App\Services\Payments\PaymentGatewayService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentGatewayIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_paypal_wallet_topup_converts_egp_to_a_supported_currency(): void
    {
        $tenant = Tenant::factory()->create();
        $this->createDomain($tenant, 'payments.test');
        $student = $this->memberWithRole($tenant, 'student');

        $this->saveGatewaySettings($tenant, [
            'paypal' => [
                'environment' => 'test',
                'is_active' => true,
                'client_id' => 'sandbox-client-id',
                'client_secret' => 'sandbox-client-secret',
            ],
        ]);

        Http::fake([
            'api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response(['access_token' => 'access-token']),
            'open.er-api.com/v6/latest/EGP' => Http::response([
                'result' => 'success',
                'rates' => ['USD' => 0.05],
            ]),
            'api-m.sandbox.paypal.com/v2/checkout/orders' => Http::response([
                'id' => 'ORDER-WALLET',
                'links' => [['rel' => 'approve', 'href' => 'https://www.sandbox.paypal.com/checkoutnow?token=ORDER-WALLET']],
            ]),
        ]);

        Sanctum::actingAs($student->user);

        $response = $this->postJson('/api/v1/student/wallet/online-recharge', [
            'amount' => 100,
            'provider' => 'paypal',
        ], [
            'X-Tenant-ID' => (string) $tenant->id,
            'Host' => 'payments.test',
        ])->assertCreated()
            ->assertJsonPath('data.currency', 'EGP')
            ->assertJsonPath('data.gateway_amount', '5.00')
            ->assertJsonPath('data.gateway_currency', 'USD');

        Http::assertSent(fn (Request $request): bool => $request->url() === 'https://api-m.sandbox.paypal.com/v2/checkout/orders'
            && $request['purchase_units'][0]['amount']['currency_code'] === 'USD'
            && $request['purchase_units'][0]['amount']['value'] === '5.00'
            && str_contains((string) $request['application_context']['return_url'], 'http://payments.test/api/v1/payments/paypal/return'));

        $payment = WalletPayment::where('reference', $response->json('data.reference'))->firstOrFail();
        $this->assertSame('5.00', (string) $payment->metadata['gateway_amount']);
        $this->assertSame('USD', $payment->metadata['gateway_currency']);
    }

    public function test_paymob_browser_return_redirects_without_hmac_payload(): void
    {
        $tenant = Tenant::factory()->create();
        $this->createDomain($tenant, 'payments.test');
        $payment = $this->payment($tenant, 'paymob', [
            'provider_invoice_id' => '7001',
        ]);

        $this->withHeaders(['Host' => 'payments.test'])
            ->get('/api/v1/payments/paymob/return?reference='.$payment->reference)
            ->assertRedirect('http://payments.test/wallet/recharge-result?reference='.$payment->reference);
    }

    public function test_paypal_return_ignores_untrusted_forwarded_host(): void
    {
        $tenant = Tenant::factory()->create();
        $this->createDomain($tenant, 'payments.test');
        $payment = $this->payment($tenant, 'paypal', [
            'status' => WalletPayment::STATUS_PAID,
        ]);

        $this->withHeaders([
            'Host' => 'payments.test',
            'X-Forwarded-Host' => 'attacker.example',
            'X-Forwarded-Proto' => 'https',
        ])->get('/api/v1/payments/paypal/return?reference='.$payment->reference)
            ->assertRedirect('https://payments.test/wallet/recharge-result?reference='.$payment->reference);
    }

    public function test_fawaterk_paid_webhook_credits_only_a_verified_matching_invoice(): void
    {
        $tenant = Tenant::factory()->create();
        $this->createDomain($tenant, 'payments.test');
        $student = $this->memberWithRole($tenant, 'student');
        $wallet = Wallet::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $student->id,
            'balance' => 0,
            'currency' => 'EGP',
        ]);
        $payment = $this->payment($tenant, 'fawaterk', [
            'wallet_id' => $wallet->id,
            'tenant_user_id' => $student->id,
            'provider_invoice_id' => '1001',
            'provider_invoice_key' => 'invoice-key',
        ]);
        $this->saveGatewaySettings($tenant, [
            'fawaterk' => [
                'environment' => 'test',
                'is_active' => true,
                'api_key' => 'fw-api-key',
                'secret_key' => 'fw-secret',
            ],
        ]);

        Http::fake([
            'staging.fawaterk.com/api/v2/getInvoiceData/1001' => Http::response([
                'status' => 'success',
                'data' => [
                    'invoice_id' => 1001,
                    'currency' => 'EGP',
                    'total' => 100,
                    'paid' => 1,
                ],
            ]),
        ]);

        $this->postJson('/api/v1/payments/fawaterk/webhook_json', $this->fawaterkPayload(
            $payment,
            'fw-secret',
            ['invoice_status' => 'paid'],
        ), ['Host' => 'payments.test'])->assertOk();

        $this->assertDatabaseHas('wallet_payments', [
            'id' => $payment->id,
            'status' => WalletPayment::STATUS_PAID,
        ]);
        $this->assertSame(100.0, (float) $wallet->fresh()->balance);
    }

    public function test_fawaterk_rejects_a_paid_webhook_for_a_different_invoice_amount(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $wallet = Wallet::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $student->id,
            'balance' => 0,
            'currency' => 'EGP',
        ]);
        $payment = $this->payment($tenant, 'fawaterk', [
            'wallet_id' => $wallet->id,
            'tenant_user_id' => $student->id,
            'provider_invoice_id' => '1002',
            'provider_invoice_key' => 'invoice-key',
        ]);
        $this->saveGatewaySettings($tenant, [
            'fawaterk' => [
                'environment' => 'test',
                'is_active' => true,
                'api_key' => 'fw-api-key',
                'secret_key' => 'fw-secret',
            ],
        ]);

        Http::fake([
            'staging.fawaterk.com/api/v2/getInvoiceData/1002' => Http::response([
                'status' => 'success',
                'data' => [
                    'invoice_id' => 1002,
                    'currency' => 'EGP',
                    'total' => 10,
                    'paid' => 1,
                ],
            ]),
        ]);

        $this->postJson('/api/v1/payments/fawaterk/webhook_json', $this->fawaterkPayload(
            $payment,
            'fw-secret',
            ['invoice_status' => 'paid'],
        ))->assertUnprocessable();

        $this->assertDatabaseHas('wallet_payments', [
            'id' => $payment->id,
            'status' => WalletPayment::STATUS_PENDING,
        ]);
        $this->assertSame(0.0, (float) $wallet->fresh()->balance);
    }

    public function test_late_fawaterk_failure_webhook_does_not_downgrade_a_paid_payment(): void
    {
        $tenant = Tenant::factory()->create();
        $payment = $this->payment($tenant, 'fawaterk', [
            'status' => WalletPayment::STATUS_PAID,
            'provider_invoice_id' => '1003',
            'provider_invoice_key' => 'invoice-key',
        ]);
        $this->saveGatewaySettings($tenant, [
            'fawaterk' => [
                'environment' => 'test',
                'is_active' => true,
                'api_key' => 'fw-api-key',
                'secret_key' => 'fw-secret',
            ],
        ]);

        Http::preventStrayRequests();

        $this->postJson('/api/v1/payments/fawaterk/webhook_json', $this->fawaterkPayload(
            $payment,
            'fw-secret',
            ['invoice_status' => 'failed'],
        ))->assertOk();

        $this->assertDatabaseHas('wallet_payments', [
            'id' => $payment->id,
            'status' => WalletPayment::STATUS_PAID,
        ]);
    }

    public function test_fawaterk_cannot_be_resolved_as_active_without_a_webhook_secret(): void
    {
        $tenant = Tenant::factory()->create();
        $this->saveGatewaySettings($tenant, [
            'fawaterk' => [
                'environment' => 'test',
                'is_active' => true,
                'api_key' => 'fw-api-key',
            ],
        ]);

        $service = app(PaymentGatewayService::class);

        $this->assertNull($service->config($tenant, 'fawaterk'));
        $this->assertSame([], $service->activeProviders($tenant));
    }

    /**
     * @param  array<string, array<string, mixed>>  $overrides
     */
    private function saveGatewaySettings(Tenant $tenant, array $overrides): void
    {
        $gateways = [];
        foreach (PaymentGatewayService::PROVIDERS as $provider) {
            $gateways[$provider] = $overrides[$provider] ?? [];
        }

        TenantSetting::create([
            'tenant_id' => $tenant->id,
            'group' => PaymentGatewayService::SETTINGS_GROUP,
            'values' => ['gateways' => $gateways],
        ]);
    }

    private function createDomain(Tenant $tenant, string $domain): void
    {
        TenantDomain::create([
            'tenant_id' => $tenant->id,
            'domain' => $domain,
            'subdomain' => null,
            'type' => 'custom',
            'status' => 'active',
            'is_primary' => true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function payment(Tenant $tenant, string $provider, array $overrides = []): WalletPayment
    {
        $attributes = array_merge([
            'tenant_id' => $tenant->id,
            'wallet_id' => null,
            'tenant_user_id' => null,
            'reference' => strtoupper($provider).'-REFERENCE-'.random_int(1000, 9999),
            'amount' => 100,
            'currency' => 'EGP',
            'status' => WalletPayment::STATUS_PENDING,
            'payment_type' => 'wallet_topup',
            'provider' => $provider,
            'metadata' => [],
        ], $overrides);

        if ($attributes['tenant_user_id'] === null) {
            $attributes['tenant_user_id'] = TenantUser::factory()->create([
                'tenant_id' => $tenant->id,
                'user_id' => User::factory()->create()->id,
                'status' => 'active',
            ])->id;
        }

        return WalletPayment::create($attributes);
    }

    /**
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private function fawaterkPayload(WalletPayment $payment, string $secret, array $extra = []): array
    {
        $payload = array_merge([
            'invoice_id' => (int) $payment->provider_invoice_id,
            'invoice_key' => $payment->provider_invoice_key,
            'payment_method' => 'Card',
            'pay_load' => ['reference' => $payment->reference],
        ], $extra);

        $payload['hashKey'] = hash_hmac(
            'sha256',
            'InvoiceId='.$payload['invoice_id'].'&InvoiceKey='.$payload['invoice_key'].'&PaymentMethod='.$payload['payment_method'],
            $secret,
        );

        return $payload;
    }

    private function memberWithRole(Tenant $tenant, string $roleSlug): TenantUser
    {
        if (! Role::query()->where('tenant_id', $tenant->id)->exists()) {
            $this->seed(IdentityAccessSeeder::class);
        }

        $this->assertTrue(Permission::query()->where('slug', 'enrollments.manage')->exists());

        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'active',
        ]);

        $role = Role::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', $roleSlug)
            ->firstOrFail();

        $membership->roles()->attach($role->id, ['tenant_id' => $tenant->id]);

        return $membership->load('user');
    }
}
