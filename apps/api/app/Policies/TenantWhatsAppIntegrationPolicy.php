<?php

namespace App\Policies;

use App\Models\Tenant;
use App\Models\TenantWhatsAppIntegration;
use App\Models\User;
use App\Services\Authorization\TenantAuthorizationService;

class TenantWhatsAppIntegrationPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isTenantAdministrator($user, currentTenant());
    }

    public function view(User $user, TenantWhatsAppIntegration $integration): bool
    {
        $tenant = currentTenant();

        return $integration->tenant_id === $tenant->id
            && $this->isTenantAdministrator($user, $tenant);
    }

    public function create(User $user): bool
    {
        return $this->isTenantAdministrator($user, currentTenant());
    }

    public function update(User $user, TenantWhatsAppIntegration $integration): bool
    {
        $tenant = currentTenant();

        return $integration->tenant_id === $tenant->id
            && $this->isTenantAdministrator($user, $tenant);
    }

    public function delete(User $user, TenantWhatsAppIntegration $integration): bool
    {
        $tenant = currentTenant();

        return $integration->tenant_id === $tenant->id
            && $this->isTenantAdministrator($user, $tenant);
    }

    public function manage(User $user, ?TenantWhatsAppIntegration $integration = null): bool
    {
        $tenant = currentTenant();

        if ($integration !== null && $integration->tenant_id !== $tenant->id) {
            return false;
        }

        return $this->isTenantAdministrator($user, $tenant);
    }

    private function isTenantAdministrator(User $user, Tenant $tenant): bool
    {
        return $this->auth()->hasRole($user, $tenant, 'tenant_owner')
            || $this->auth()->hasRole($user, $tenant, 'admin');
    }

    private function auth(): TenantAuthorizationService
    {
        return app(TenantAuthorizationService::class);
    }
}
