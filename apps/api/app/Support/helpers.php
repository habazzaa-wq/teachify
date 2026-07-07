<?php

use App\Models\Tenant;
use App\Models\TenantUser;

if (! function_exists('currentTenant')) {
    /**
     * Get the currently active tenant.
     *
     * @return Tenant
     */
    function currentTenant(): Tenant
    {
        if (app()->bound('currentTenant')) {
            return app('currentTenant');
        }

        throw new RuntimeException('Tenant context is missing.');
    }
}

if (! function_exists('currentTenantUser')) {
    /**
     * Get the currently authenticated tenant user membership.
     *
     * @return TenantUser|null
     */
    function currentTenantUser(): ?TenantUser
    {
        if (app()->bound('currentTenantMembership')) {
            return app('currentTenantMembership');
        }

        return null;
    }
}
