<?php

namespace App\Policies;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Authorization\TenantAuthorizationService;

class AuditPolicy
{
    public function __construct(private readonly TenantAuthorizationService $authorization)
    {
    }

    public function viewAuditLogs(TenantUser $viewer, Tenant $tenant): bool
    {
        if ($viewer->tenant_id !== $tenant->id || $viewer->status !== 'active') {
            return false;
        }

        return $this->isTenantOperator($viewer, $tenant)
            || $this->authorization->hasRole($viewer->user, $tenant, 'instructor');
    }

    public function viewActivityLogs(TenantUser $viewer, Tenant $tenant): bool
    {
        // All active tenant members may view activity logs (their own view is
        // scoped server-side; students see only their own activity).
        return $viewer->tenant_id === $tenant->id && $viewer->status === 'active';
    }

    public function viewOwnActivity(TenantUser $viewer, Tenant $tenant): bool
    {
        return $viewer->tenant_id === $tenant->id && $viewer->status === 'active';
    }

    private function isTenantOperator(TenantUser $viewer, Tenant $tenant): bool
    {
        return $this->authorization->hasRole($viewer->user, $tenant, 'tenant_owner')
            || $this->authorization->hasRole($viewer->user, $tenant, 'admin');
    }
}
