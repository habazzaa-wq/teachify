<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\TenantSetting;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Payments\PaymentGatewayService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymobDirectPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_paymob_direct_checkout_uses_the_configured_sandbox_environment(): void
    {
        $tenant = Tenant::factory()->create([
            'feature_flags' => ['has_wallet' => false, 'has_regional_pricing' => true],
        ]);
        TenantDomain::create([
            'tenant_id' => $tenant->id,
            'domain' => 'payments.test',
            'type' => 'custom',
            'status' => 'active',
            'is_primary' => true,
        ]);

        if (! Role::query()->where('tenant_id', $tenant->id)->exists()) {
            $this->seed(IdentityAccessSeeder::class);
        }

        $user = User::factory()->create(['name' => 'Test Student']);
        $student = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
            'phone' => '01000000001',
        ]);
        $student->roles()->attach(Role::where('tenant_id', $tenant->id)->where('slug', 'student')->firstOrFail()->id, ['tenant_id' => $tenant->id]);

        $course = Course::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $student->id,
            'title' => 'Test course',
            'slug' => 'test-course',
            'status' => 'published',
            'visibility' => 'public',
            'difficulty' => 'beginner',
            'language' => 'ar',
            'delivery_mode' => Course::DELIVERY_MODE_RECORDED_ONLY,
            'pricing_type' => 'one_time',
            'price_amount' => 385,
            'regional_prices' => ['SA' => 927],
        ]);

        TenantSetting::create([
            'tenant_id' => $tenant->id,
            'group' => PaymentGatewayService::SETTINGS_GROUP,
            'values' => ['gateways' => [
                'fawaterk' => [],
                'paypal' => [],
                'paymob' => [
                    'environment' => 'test',
                    'is_active' => true,
                    'api_key' => 'paymob-key',
                    'hmac_secret' => 'paymob-hmac',
                    'integration_id' => 123,
                    'iframe_id' => 456,
                ],
            ]],
        ]);

        Http::fake([
            'accept.paymobsolutions.com/api/auth/tokens' => Http::response(['token' => 'auth-token']),
            'accept.paymobsolutions.com/api/ecommerce/orders' => Http::response(['id' => 987]),
            'accept.paymobsolutions.com/api/acceptance/payment_keys' => Http::response(['token' => 'payment-token']),
        ]);

        Sanctum::actingAs($user);

        $response = $this->withHeaders(['X-Tenant-ID' => (string) $tenant->id, 'Host' => 'payments.test', 'CF-IPCountry' => 'EG'])
            ->getJson('/api/v1/public/courses/test-course/direct-payment/quote?provider=paymob');
        $response->assertOk()
            ->assertJsonPath('data.gateway_amount', '385.00')
            ->assertJsonPath('data.gateway_currency', 'EGP');

        $this->withHeaders(['X-Tenant-ID' => (string) $tenant->id, 'Host' => 'payments.test', 'CF-IPCountry' => 'EG'])
            ->postJson('/api/v1/public/courses/test-course/direct-payment', ['provider' => 'paymob'])
            ->assertCreated()
            ->assertJsonPath('data.payment_url', 'https://accept.paymobsolutions.com/api/acceptance/iframes/456?payment_token=payment-token');

        Http::assertSent(fn ($request): bool => str_starts_with($request->url(), 'https://accept.paymobsolutions.com/'));
    }
}
