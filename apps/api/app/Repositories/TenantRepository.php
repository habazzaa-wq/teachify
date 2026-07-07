<?php

namespace App\Repositories;

use App\Models\Tenant;
use App\Models\TenantDomain;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class TenantRepository
{
    public function findById(int|string $id): ?Tenant
    {
        try {
            $result = Cache::get("tenant.{$id}");

            if ($result instanceof \__PHP_Incomplete_Class) {
                Cache::forget("tenant.{$id}");
                $result = null;
            }

            if ($result !== null) {
                return $result;
            }
        } catch (\Throwable $e) {
            Cache::forget("tenant.{$id}");
        }

        $tenant = Tenant::query()->whereKey($id)->first();
        Cache::put("tenant.{$id}", $tenant, 3600);

        return $tenant;
    }

    public function isActive(int|string $id): bool
    {
        $tenant = $this->findById($id);

        return $tenant && $tenant->status === 'active';
    }

    public function findByDomain(string $domain): ?Tenant
    {
        $normalized = $this->normalizeDomain($domain);

        $tenantId = Cache::remember("domain.owner.{$normalized}", 3600, function () use ($normalized): ?int {
            return TenantDomain::query()
                ->where('domain', $normalized)
                ->where('status', 'active')
                ->value('tenant_id');
        });

        if ($tenantId === null) {
            return null;
        }

        return $this->findById($tenantId);
    }

    public function findByHostname(string $hostname): ?Tenant
    {
        $normalized = $this->normalizeDomain($hostname);

        return $this->findByDomain($normalized);
    }

    public function normalizeDomain(string $domain): string
    {
        $domain = mb_strtolower(trim($domain));

        $domain = preg_replace('/^https?:\/\//', '', $domain);
        $domain = preg_replace('/\/+$/', '', $domain);

        return $domain;
    }
}
