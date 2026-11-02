<?php

namespace App\Http\Resources;

use App\Services\Commerce\CourseRegionalPricing;
use App\Services\Commerce\TenantCommerceFeatures;
use Illuminate\Http\Request;

class PublicCourseResource extends CourseResource
{
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);
        $tenant = currentTenant();

        if (app(TenantCommerceFeatures::class)->regionalPricingEnabled($tenant)) {
            $price = app(CourseRegionalPricing::class)->price($tenant, $this->resource, $request);
            $data['price'] = $price['amount'];
            $data['discountPrice'] = null;
            $data['currency'] = $price['currency'];
            $data['priceCountry'] = $price['country_code'];
        }

        return $data;
    }
}
