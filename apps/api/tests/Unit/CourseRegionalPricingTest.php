<?php

namespace Tests\Unit;

use App\Models\Course;
use App\Models\Tenant;
use App\Services\Commerce\CourseRegionalPricing;
use Illuminate\Http\Request;
use Tests\TestCase;

class CourseRegionalPricingTest extends TestCase
{
    public function test_it_selects_the_configured_country_price_and_currency(): void
    {
        $tenant = new Tenant();
        $tenant->feature_flags = ['has_regional_pricing' => true];

        $course = new Course();
        $course->price_amount = 500;
        $course->price_currency = 'EGP';
        $course->regional_prices = ['SA' => 30];

        $request = Request::create('/');
        $request->headers->set('CF-IPCountry', 'SA');

        $this->assertSame([
            'amount' => 30.0,
            'currency' => 'SR',
            'country_code' => 'SA',
        ], app(CourseRegionalPricing::class)->price($tenant, $course, $request));
    }

    public function test_it_uses_the_egyptian_price_when_country_is_unconfigured_or_feature_is_disabled(): void
    {
        $course = new Course();
        $course->price_amount = 500;
        $course->discount_price = 450;
        $course->price_currency = 'EGP';
        $course->regional_prices = ['SA' => 30];

        $tenant = new Tenant();
        $tenant->feature_flags = ['has_regional_pricing' => true];
        $request = Request::create('/');
        $request->headers->set('CF-IPCountry', 'US');

        $this->assertSame([
            'amount' => 450.0,
            'currency' => 'EGP',
            'country_code' => 'EG',
        ], app(CourseRegionalPricing::class)->price($tenant, $course, $request));

        $tenant->feature_flags = ['has_regional_pricing' => false];
        $request->headers->set('CF-IPCountry', 'SA');

        $this->assertSame([
            'amount' => 450.0,
            'currency' => 'EGP',
            'country_code' => 'EG',
        ], app(CourseRegionalPricing::class)->price($tenant, $course, $request));
    }
}
