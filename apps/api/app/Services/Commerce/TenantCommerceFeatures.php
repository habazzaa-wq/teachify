<?php

namespace App\Services\Commerce;

use App\Models\Tenant;

class TenantCommerceFeatures
{
    public function walletEnabled(Tenant $tenant): bool
    {
        return (bool) ($tenant->feature_flags['has_wallet'] ?? true);
    }

    public function regionalPricingEnabled(Tenant $tenant): bool
    {
        return (bool) ($tenant->feature_flags['has_regional_pricing'] ?? false);
    }
}
