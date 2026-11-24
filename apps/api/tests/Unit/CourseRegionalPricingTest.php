<?php

namespace Tests\Unit;

use App\Models\Course;
use App\Models\Tenant;
use App\Services\Commerce\CourseRegionalPricing;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CourseRegionalPricingTest extends TestCase
{
    private function tenant(bool $regionalPricing = true): Tenant
    {
        $tenant = new Tenant();
        $tenant->feature_flags = ['has_regional_pricing' => $regionalPricing];

        return $tenant;
    }

    private function requestFor(string $countryCode): Request
    {
        $request = Request::create('/');
        $request->headers->set('CF-IPCountry', $countryCode);

        return $request;
    }

    public function test_it_selects_the_configured_country_price_and_currency(): void
    {
        $course = new Course();
        $course->price_amount = 500;
        $course->price_currency = 'EGP';
        $course->regional_prices = ['SA' => 30];

        $this->assertSame([
            'amount' => 30.0,
            'currency' => 'SR',
            'country_code' => 'SA',
        ], app(CourseRegionalPricing::class)->price($this->tenant(), $course, $this->requestFor('SA')));
    }

    public function test_it_uses_the_currency_stored_with_each_country_price(): void
    {
        $course = new Course();
        $course->price_amount = 500;
        $course->regional_prices = [
            'US' => ['amount' => 12.5, 'currency' => 'USD'],
            'FR' => ['amount' => 15, 'currency' => 'EUR'],
        ];

        $service = app(CourseRegionalPricing::class);

        $this->assertSame([
            'amount' => 12.5,
            'currency' => 'USD',
            'country_code' => 'US',
        ], $service->price($this->tenant(), $course, $this->requestFor('US')));

        $this->assertSame([
            'amount' => 15.0,
            'currency' => 'EUR',
            'country_code' => 'FR',
        ], $service->price($this->tenant(), $course, $this->requestFor('FR')));
    }

    public function test_it_uses_the_fallback_for_countries_without_an_explicit_price(): void
    {
        $course = new Course();
        $course->price_amount = 500;
        $course->discount_price = 450;
        $course->price_currency = 'EGP';
        $course->regional_prices = ['SA' => ['amount' => 30, 'currency' => 'SR']];
        $course->default_regional_price = ['amount' => 20, 'currency' => 'USD'];

        $this->assertSame([
            'amount' => 20.0,
            'currency' => 'USD',
            'country_code' => 'FR',
        ], app(CourseRegionalPricing::class)->price($this->tenant(), $course, $this->requestFor('FR')));
    }

    public function test_it_uses_the_egyptian_base_price_when_no_fallback_or_feature_is_configured(): void
    {
        $course = new Course();
        $course->price_amount = 500;
        $course->discount_price = 450;
        $course->price_currency = 'EGP';
        $course->regional_prices = ['SA' => 30];

        $service = app(CourseRegionalPricing::class);

        $this->assertSame([
            'amount' => 450.0,
            'currency' => 'EGP',
            'country_code' => 'EG',
        ], $service->price($this->tenant(), $course, $this->requestFor('US')));

        // Egypt always keeps the base price even when a fallback exists.
        $course->default_regional_price = ['amount' => 20, 'currency' => 'USD'];
        $this->assertSame([
            'amount' => 450.0,
            'currency' => 'EGP',
            'country_code' => 'EG',
        ], $service->price($this->tenant(), $course, $this->requestFor('EG')));

        $this->assertSame([
            'amount' => 450.0,
            'currency' => 'EGP',
            'country_code' => 'EG',
        ], $service->price($this->tenant(false), $course, $this->requestFor('SA')));
    }

    public function test_it_normalizes_new_and_legacy_price_shapes(): void
    {
        $normalized = app(CourseRegionalPricing::class)->normalize($this->tenant(), [
            'US' => ['amount' => '12.456', 'currency' => 'usd'],
            'SA' => 30,
        ]);

        $this->assertSame([
            'US' => ['amount' => 12.46, 'currency' => 'USD'],
            'SA' => ['amount' => 30.0, 'currency' => 'SR'],
        ], $normalized);
    }

    public function test_it_rejects_unknown_countries_and_invalid_currencies(): void
    {
        $service = app(CourseRegionalPricing::class);

        try {
            $service->normalize($this->tenant(), ['ZZ' => ['amount' => 10, 'currency' => 'USD']]);
            $this->fail('Unknown country should be rejected.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('regional_prices', $exception->errors());
        }

        try {
            $service->normalizeDefault($this->tenant(), ['amount' => 10, 'currency' => 'USDD']);
            $this->fail('Invalid currency should be rejected.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('default_regional_price.currency', $exception->errors());
        }
    }
}
