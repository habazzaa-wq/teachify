<?php

namespace App\Services\Commerce;

use App\Models\Course;
use App\Models\Tenant;
use App\Support\CountryData;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CourseRegionalPricing
{
    /** Kept as a constant so existing callers keep working. */
    public const COUNTRIES = CountryData::COUNTRIES;

    /** Currency code used by the existing Fawaterk integration for Saudi Arabia. */
    private const LEGACY_CURRENCY = ['SA' => 'SR'];

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
        $regionalPrices = $this->readCountryPrices($course->regional_prices);

        if (app(TenantCommerceFeatures::class)->regionalPricingEnabled($tenant)) {
            if (isset($regionalPrices[$countryCode])) {
                return [
                    'amount' => $regionalPrices[$countryCode]['amount'],
                    'currency' => $regionalPrices[$countryCode]['currency'],
                    'country_code' => $countryCode,
                ];
            }

            // Egypt always keeps the base price (EGP). Every other country that
            // has no explicit price uses the tenant's configured fallback.
            if ($countryCode !== 'EG') {
                $fallback = $this->readDefaultPrice($course->default_regional_price);
                if ($fallback !== null) {
                    return [
                        'amount' => $fallback['amount'],
                        'currency' => $fallback['currency'],
                        'country_code' => $countryCode,
                    ];
                }
            }
        }

        return [
            'amount' => (float) ($course->discount_price ?? $course->price_amount ?? 0),
            'currency' => 'EGP',
            'country_code' => 'EG',
        ];
    }

    /**
     * Normalize the per-country prices submitted by the course form.
     * Both the new shape (`['amount' => 10, 'currency' => 'USD']`) and the old
     * numeric shape (`10`) are accepted so existing integrations keep working.
     *
     * @param mixed $prices
     * @return array<string, array{amount: float, currency: string}>
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
        foreach ($prices as $countryCode => $value) {
            $countryCode = strtoupper((string) $countryCode);
            if (! isset(self::COUNTRIES[$countryCode])) {
                throw ValidationException::withMessages([
                    'regional_prices' => ['اختر دولة مدعومة فقط من القائمة.'],
                ]);
            }

            $fallbackCurrency = self::LEGACY_CURRENCY[$countryCode] ?? self::COUNTRIES[$countryCode]['currency'];
            $normalized[$countryCode] = $this->normalizeEntry(
                is_array($value) ? ($value['amount'] ?? $value['price'] ?? null) : $value,
                is_array($value) ? ($value['currency'] ?? $fallbackCurrency) : $fallbackCurrency,
                "regional_prices.{$countryCode}",
            );
        }

        return $normalized;
    }

    /**
     * Normalize the price/currency used for countries that are not configured.
     *
     * @param mixed $default
     * @return array{amount: float, currency: string}|null
     */
    public function normalizeDefault(Tenant $tenant, mixed $default): ?array
    {
        if ($default === null || $default === '' || $default === []) {
            return null;
        }

        if (! is_array($default)) {
            throw ValidationException::withMessages([
                'default_regional_price' => ['سعر الدول غير المضافة غير صالح.'],
            ]);
        }

        if (! app(TenantCommerceFeatures::class)->regionalPricingEnabled($tenant)) {
            throw ValidationException::withMessages([
                'default_regional_price' => ['ميزة التسعير حسب الدولة غير مفعّلة لهذه الأكاديمية.'],
            ]);
        }

        return $this->normalizeEntry(
            $default['amount'] ?? $default['price'] ?? null,
            $default['currency'] ?? 'EGP',
            'default_regional_price',
        );
    }

    /**
     * @return array<string, array{amount: float, currency: string}>
     */
    private function readCountryPrices(mixed $prices): array
    {
        if (! is_array($prices)) {
            return [];
        }

        $result = [];
        foreach ($prices as $countryCode => $value) {
            $countryCode = strtoupper((string) $countryCode);
            if (! isset(self::COUNTRIES[$countryCode])) {
                continue;
            }

            $fallbackCurrency = self::LEGACY_CURRENCY[$countryCode] ?? self::COUNTRIES[$countryCode]['currency'];
            if (is_array($value)) {
                $amount = $value['amount'] ?? $value['price'] ?? null;
                $currency = $value['currency'] ?? $fallbackCurrency;
            } else {
                $amount = $value;
                $currency = $fallbackCurrency;
            }

            if (! is_numeric($amount) || (float) $amount <= 0) {
                continue;
            }

            $currency = strtoupper((string) $currency);
            if (! preg_match('/^[A-Z]{2,3}$/', $currency)) {
                continue;
            }

            $result[$countryCode] = ['amount' => (float) $amount, 'currency' => $currency];
        }

        return $result;
    }

    /**
     * @return array{amount: float, currency: string}|null
     */
    private function readDefaultPrice(mixed $default): ?array
    {
        if (! is_array($default)) {
            return null;
        }

        $amount = $default['amount'] ?? $default['price'] ?? null;
        $currency = strtoupper((string) ($default['currency'] ?? 'EGP'));

        if (! is_numeric($amount) || (float) $amount <= 0 || ! preg_match('/^[A-Z]{2,3}$/', $currency)) {
            return null;
        }

        return ['amount' => (float) $amount, 'currency' => $currency];
    }

    /**
     * @return array{amount: float, currency: string}
     */
    private function normalizeEntry(mixed $amount, mixed $currency, string $attribute): array
    {
        if (! is_numeric($amount) || (float) $amount < 1 || (float) $amount > 100000000) {
            throw ValidationException::withMessages([
                $attribute => ['أدخل سعراً أكبر من صفر وبحد أقصى 100,000,000.'],
            ]);
        }

        $currency = strtoupper(trim((string) $currency));
        if (! preg_match('/^[A-Z]{2,3}$/', $currency)) {
            throw ValidationException::withMessages([
                "{$attribute}.currency" => ['العملة يجب أن تكون رمزاً مكوّناً من 2 إلى 3 أحرف.'],
            ]);
        }

        return ['amount' => round((float) $amount, 2), 'currency' => $currency];
    }
}
