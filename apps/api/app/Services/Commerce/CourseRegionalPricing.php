<?php

namespace App\Services\Commerce;

use App\Models\Course;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CourseRegionalPricing
{
    /**
     * The currency codes are the currencies currently accepted by Fawaterk's
     * invoice-link API. Countries without a supported settlement currency use
     * the tenant's default Egyptian price.
     *
     * @var array<string, array{name: string, currency: string}>
     */
    public const COUNTRIES = [
        'EG' => ['name' => 'مصر', 'currency' => 'EGP'],
        'SA' => ['name' => 'السعودية', 'currency' => 'SR'],
        'AE' => ['name' => 'الإمارات', 'currency' => 'AED'],
        'KW' => ['name' => 'الكويت', 'currency' => 'KWD'],
        'QA' => ['name' => 'قطر', 'currency' => 'QAR'],
        'BH' => ['name' => 'البحرين', 'currency' => 'BHD'],
        'US' => ['name' => 'الولايات المتحدة', 'currency' => 'USD'],
    ];

    public function countryCode(Request $request): string
    {
        $countryCode = strtoupper((string) $request->header('CF-IPCountry', ''));

        return isset(self::COUNTRIES[$countryCode]) ? $countryCode : 'EG';
    }

    /**
     * @return array{amount: float, currency: string, country_code: string}
     */
    public function price(Tenant $tenant, Course $course, Request $request): array
    {
        $countryCode = $this->countryCode($request);
        $regionalPrices = $course->regional_prices ?? [];

        if ($countryCode !== 'EG'
            && app(TenantCommerceFeatures::class)->regionalPricingEnabled($tenant)
            && isset($regionalPrices[$countryCode])) {
            return [
                'amount' => (float) $regionalPrices[$countryCode],
                'currency' => self::COUNTRIES[$countryCode]['currency'],
                'country_code' => $countryCode,
            ];
        }

        return [
            'amount' => (float) ($course->discount_price ?? $course->price_amount ?? 0),
            'currency' => 'EGP',
            'country_code' => 'EG',
        ];
    }

    /**
     * @param mixed $prices
     * @return array<string, float>
     */
    public function normalize(Tenant $tenant, mixed $prices): array
    {
        if (! is_array($prices)) {
            throw ValidationException::withMessages([
                'regional_prices' => ['أسعار الدول غير صالحة.'],
            ]);
        }

        if ($prices !== [] && ! app(TenantCommerceFeatures::class)->regionalPricingEnabled($tenant)) {
            throw ValidationException::withMessages([
                'regional_prices' => ['ميزة التسعير حسب الدولة غير مفعّلة لهذه الأكاديمية.'],
            ]);
        }

        $normalized = [];
        foreach ($prices as $countryCode => $amount) {
            $countryCode = strtoupper((string) $countryCode);
            if ($countryCode === 'EG' || ! isset(self::COUNTRIES[$countryCode])) {
                throw ValidationException::withMessages([
                    'regional_prices' => ['اختر دولة مدعومة فقط؛ سعر مصر هو السعر الأساسي للدورة.'],
                ]);
            }

            if (! is_numeric($amount) || (float) $amount < 1 || (float) $amount > 100000000) {
                throw ValidationException::withMessages([
                    "regional_prices.{$countryCode}" => ['أدخل سعراً أكبر من صفر وبحد أقصى 100,000,000.'],
                ]);
            }

            $normalized[$countryCode] = round((float) $amount, 2);
        }

        return $normalized;
    }
}
