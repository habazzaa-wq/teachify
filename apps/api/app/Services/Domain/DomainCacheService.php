<?php

namespace App\Services\Domain;

use App\Models\TenantDomain;
use App\Repositories\TenantRepository;

class DomainCacheService
{
    public function __construct(private readonly TenantRepository $tenants) {}

    public function invalidate(string $domain): void
    {
        $this->tenants->forgetDomain($domain);
    }

    public function invalidateTenant(int $tenantId): void
    {
        TenantDomain::where('tenant_id', $tenantId)
            ->pluck('domain')
            ->each(fn(string $domain) => $this->invalidate($domain));
    }

    public function invalidateDomain(TenantDomain $domain): void
    {
        $this->invalidate($domain->domain);
    }
}
