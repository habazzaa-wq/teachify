<?php

namespace App\Http\Controllers\Api\v1\Public;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\TenantUser;
use App\Models\WalletPayment;
use App\Services\Commerce\CourseRegionalPricing;
use App\Services\Commerce\TenantCommerceFeatures;
use App\Services\Payments\Exceptions\PaymentGatewayException;
use App\Services\Payments\FawaterkService;
use App\Services\Payments\PaymentGatewayService;
use App\Services\Payments\PayPalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DirectCoursePaymentController extends Controller
{
    public function __construct(
        private readonly PaymentGatewayService $gatewayService,
        private readonly FawaterkService $fawaterkService,
        private readonly PayPalService $paypalService,
        private readonly CourseRegionalPricing $regionalPricing,
    ) {}

    public function quote(Request $request, string $slug): JsonResponse
    {
        $tenant = currentTenant();
        abort_unless(
            ! app(TenantCommerceFeatures::class)->walletEnabled($tenant)
                && app(TenantCommerceFeatures::class)->regionalPricingEnabled($tenant),
            403,
            'الدفع المباشر غير مفعّل لهذه الأكاديمية.',
        );

        $student = currentTenantUser();
        abort_if(! $student, 401, 'يجب تسجيل الدخول أولاً.');
        abort_unless(
            $student->roles()->where('slug', 'student')->exists(),
            403,
            'هذه الميزة متاحة للطلاب فقط.',
        );

        $course = Course::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', $slug)
            ->where('status', 'published')
            ->where('visibility', 'public')
            ->firstOrFail();

        abort_if($course->pricing_type === 'free', 422, 'هذه الدورة مجانية ولا تحتاج إلى دفع.');

        $quote = $this->regionalPricing->price($tenant, $course, $request);
        $validated = $request->validate([
            'provider' => ['nullable', 'string', 'in:fawaterk,paypal'],
        ]);
        $data = [
            'amount' => $quote['amount'],
            'currency' => $quote['currency'],
            'country_code' => $quote['country_code'],
            'country_name' => CourseRegionalPricing::COUNTRIES[$quote['country_code']]['name'],
        ];

        if (($validated['provider'] ?? null) === 'paypal') {
            try {
                $config = $this->gatewayService->requireConfig($tenant, 'paypal');
                $paypalAmount = $this->paypalService->amountForPayment(
                    $config,
                    (string) $quote['amount'],
                    $quote['currency'],
                );
            } catch (PaymentGatewayException $exception) {
                throw ValidationException::withMessages([
                    'payment' => [$exception->getMessage()],
                ]);
            }

            $data['gateway_amount'] = $paypalAmount['amount'];
            $data['gateway_currency'] = $paypalAmount['currency'];
            $data['gateway_environment'] = $config['environment'] ?? 'test';
        }

        return response()->json([
            'data' => $data,
        ]);
    }

    public function create(Request $request, string $slug): JsonResponse
    {
        $tenant = currentTenant();
        abort_unless(
            ! app(TenantCommerceFeatures::class)->walletEnabled($tenant)
                && app(TenantCommerceFeatures::class)->regionalPricingEnabled($tenant),
            403,
            'الدفع المباشر غير مفعّل لهذه الأكاديمية.',
        );

        $student = currentTenantUser();
        abort_if(! $student, 401, 'يجب تسجيل الدخول أولاً.');
        abort_unless(
            $student->roles()->where('slug', 'student')->exists(),
            403,
            'هذه الميزة متاحة للطلاب فقط.',
        );

        $course = Course::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', $slug)
            ->where('status', 'published')
            ->where('visibility', 'public')
            ->firstOrFail();

        abort_if($course->pricing_type === 'free', 422, 'هذه الدورة مجانية ولا تحتاج إلى دفع.');
        $validated = $request->validate([
            'provider' => ['nullable', 'string', 'in:fawaterk,paypal'],
        ]);
        abort_if(
            $course->enrollments()->where('tenant_user_id', $student->id)->where('status', 'active')->exists(),
            409,
            'أنت مشترك بالفعل في هذه الدورة.',
        );

        $quote = $this->regionalPricing->price($tenant, $course, $request);
        abort_if($quote['amount'] <= 0, 422, 'سعر الدورة غير صالح للدفع.');

        try {
            $provider = $this->gatewayService->resolveProvider($tenant, $validated['provider'] ?? null);
            $config = $this->gatewayService->requireConfig($tenant, $provider);
            $paypalAmount = [
                'amount' => (string) $quote['amount'],
                'currency' => $quote['currency'],
            ];
            if ($provider === 'paypal') {
                $paypalAmount = $this->paypalService->amountForPayment(
                    $config,
                    (string) $quote['amount'],
                    $quote['currency'],
                );
            }
        } catch (PaymentGatewayException $exception) {
            throw ValidationException::withMessages([
                'payment' => [$exception->getMessage()],
            ]);
        }
        $reference = 'COURSE-'.strtoupper(Str::random(16));
        $payment = WalletPayment::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'wallet_id' => null,
            'tenant_user_id' => $student->id,
            'reference' => $reference,
            'payment_type' => 'course_purchase',
            'amount' => $quote['amount'],
            'currency' => $quote['currency'],
            'status' => WalletPayment::STATUS_PENDING,
            'provider' => $provider,
            'metadata' => [
                'course_slug' => $course->slug,
                'country_code' => $quote['country_code'],
                'requested_by_ip' => $request->ip(),
            ],
        ]);

        $user = $student->user;
        $nameParts = array_values(array_filter(array_map('trim', explode(' ', (string) ($user?->name ?? $student->phone ?? '')))));
        $resultUrl = $request->schemeAndHttpHost().'/course-payment/result?reference='.urlencode($reference)
            .'&course='.urlencode($course->slug);

        try {
            if ($provider === 'paypal') {
                $paypalReturnUrl = $request->schemeAndHttpHost().'/api/v1/payments/paypal/return?reference='.urlencode($reference);
                $paypalResult = $this->paypalService->createOrder(
                    $config,
                    $reference,
                    $paypalAmount['amount'],
                    $paypalAmount['currency'],
                    $course->title,
                    $paypalReturnUrl,
                    $request->schemeAndHttpHost().'/api/v1/payments/paypal/cancel?reference='.urlencode($reference),
                );
                $result = [
                    'url' => $paypalResult['url'],
                    'invoice_id' => $paypalResult['order_id'],
                    'invoice_key' => null,
                ];
                $payment->update([
                    'metadata' => array_merge($payment->metadata ?? [], [
                        'paypal_amount' => $paypalAmount['amount'],
                        'paypal_currency' => $paypalAmount['currency'],
                    ]),
                ]);
            } else {
                $result = $this->fawaterkService->createInvoiceLink($config, [
                    'cartTotal' => $quote['amount'],
                    'currency' => $quote['currency'],
                    'customer' => [
                        'first_name' => $nameParts[0] ?? 'طالب',
                        'last_name' => $nameParts[1] ?? 'Teachify',
                        'email' => $user?->email,
                        'phone' => $student->phone,
                    ],
                    'cartItems' => [[
                        'name' => $course->title,
                        'price' => (string) $quote['amount'],
                        'quantity' => '1',
                    ]],
                    'sendEmail' => false,
                    'sendSMS' => false,
                    'payLoad' => ['reference' => $reference],
                    'redirectionUrls' => [
                        'successUrl' => $resultUrl.'&status=success',
                        'failUrl' => $resultUrl.'&status=failed',
                        'pendingUrl' => $resultUrl.'&status=pending',
                        'webhookUrl' => $request->schemeAndHttpHost().'/api/v1/payments/fawaterk/webhook_json',
                    ],
                ]);
            }
        } catch (PaymentGatewayException $exception) {
            $payment->update([
                'status' => WalletPayment::STATUS_FAILED,
                'failure_reason' => $exception->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'payment' => [$exception->getMessage()],
            ]);
        }

        if ($result['url'] === '') {
            $payment->update([
                'status' => WalletPayment::STATUS_FAILED,
                'failure_reason' => 'لم ترجع بوابة الدفع رابط دفع صالح.',
            ]);

            throw ValidationException::withMessages([
                'payment' => ['تعذر إنشاء رابط الدفع، حاول مرة أخرى.'],
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
                'reference' => $payment->reference,
                'payment_url' => $result['url'],
                'amount' => $quote['amount'],
                'currency' => $quote['currency'],
                'country_code' => $quote['country_code'],
                'gateway_amount' => $provider === 'paypal' ? $paypalAmount['amount'] : $quote['amount'],
                'gateway_currency' => $provider === 'paypal' ? $paypalAmount['currency'] : $quote['currency'],
            ],
        ], 201);
    }

    public function status(string $reference): JsonResponse
    {
        $tenant = currentTenant();
        $student = app(TenantUser::class);
        abort_unless(
            $student->roles()->where('slug', 'student')->exists(),
            403,
            'هذه الميزة متاحة للطلاب فقط.',
        );

        $payment = WalletPayment::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $student->id)
            ->where('reference', $reference)
            ->where('payment_type', 'course_purchase')
            ->firstOrFail();

        return response()->json([
            'data' => [
                'reference' => $payment->reference,
                'status' => $payment->status,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
                'failure_reason' => $payment->failure_reason,
                'paid_at' => $payment->paid_at?->toIso8601String(),
                'course_slug' => $payment->metadata['course_slug'] ?? null,
            ],
        ]);
    }
}
