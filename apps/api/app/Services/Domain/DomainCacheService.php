<?php

namespace App\Services\Domain;

use App\Models\TenantDomain;
use Illuminate\Support\Facades\Cache;

class DomainCacheService
{
    public function invalidate(string $domain): void
    {
        $normalized = mb_strtolower(trim($domain));
        $normalized = preg_replace('/^https?:\/\//', '', $normalized);
        $normalized = preg_replace('/\/+$/', '', $normalized);

        Cache::forget("domain.owner.{$normalized}");
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
