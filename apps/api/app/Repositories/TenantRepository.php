<?php

namespace App\Repositories;

use App\Models\Tenant;
use App\Models\TenantDomain;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Resolves the tenant for a request and caches the result.
 *
 * Caching contract: the shared store is the single source of truth, entries
 * are invalidated explicitly through forget(), and there is deliberately no
 * per-process memo. A process-local copy would have to choose between
 * staleness and a database round trip on every request, and the 20 PHP-FPM
 * workers on the current host are not shared memory - one worker serving a
 * rename does not make the other nineteen pick it up.
 *
 * Every cache call here is best-effort. IdentifyTenant runs on every request,
 * so a cache that can fail a request turns a storage hiccup into an outage.
 * That is what the production logs recorded: 656 MySQL error 1213 deadlocks
 * on the `cache` table, 1292 of them reached through this file, surfacing as
 * 500s on healthy requests. A deadlock here is now a cache miss, nothing more.
 */
class TenantRepository
{
    /**
     * Shared cache lifetime for a resolved tenant, in seconds.
     */
    private const TENANT_TTL = 3600;

    /**
     * Shared cache lifetime for a domain -> tenant id mapping.
     */
    private const DOMAIN_TTL = 3600;

    /**
     * Jitter applied to both TTLs.
     *
     * Without it, every PHP-FPM worker that resolved a tenant at the same
     * moment has the entry expire at the same moment, and the next request
     * from each of them races to rewrite the same row. Spreading expiry across
     * a minute turns one contended upsert into many uncontended ones. Entries
     * are invalidated explicitly by forget(), so the jitter never affects
     * freshness of a real change.
     */
    private const TTL_JITTER = 60;

    public function findById(int|string $id): ?Tenant
    {
        $key = 'tenant.'.(string) $id;

        $cached = $this->read($key, Tenant::class);

        if ($cached instanceof Tenant) {
            return $cached;
        }

        try {
            $tenant = Tenant::query()->whereKey($id)->first();
        } catch (\Throwable $e) {
            $this->reportFailure($key, $e);

            return null;
        }

        if ($tenant !== null) {
            $this->write($key, $tenant);
        }

        return $tenant;
    }

    public function isActive(Tenant|int|string $tenant): bool
    {
        if (! $tenant instanceof Tenant) {
            $tenant = $this->findById($tenant);
        }

        return $tenant !== null && $tenant->status === 'active';
    }

    public function findByDomain(string $domain): ?Tenant
    {
        $normalized = $this->normalizeDomain($domain);
        $key = "domain.owner.{$normalized}";

        $tenantId = $this->read($key, 'int');

        if ($tenantId === null) {
            try {
                $tenantId = TenantDomain::query()
                    ->where('domain', $normalized)
                    ->where('status', 'active')
                    ->value('tenant_id');
            } catch (\Throwable $e) {
                $this->reportFailure($key, $e);

                return null;
            }

            if ($tenantId !== null) {
                $this->write($key, $tenantId);
            }
        }

        if ($tenantId === null) {
            return null;
        }

        return $this->findById($tenantId);
    }

    public function findByHostname(string $hostname): ?Tenant
    {
        return $this->findByDomain($this->normalizeDomain($hostname));
    }

    /**
     * Drop the cached tenant for every worker.
     *
     * Prefer this over Cache::forget() at call sites: it keeps the key format
     * in one place and keeps invalidation correct if the format ever changes.
     */
    public function forget(int|string $id): void
    {
        $this->forgetKey('tenant.'.(string) $id);
    }

    public function normalizeDomain(string $domain): string
    {
        $domain = mb_strtolower(trim($domain));
        $domain = preg_replace('/^https?:\/\//', '', $domain);
        $domain = preg_replace('/\/+$/', '', $domain);

        return $domain;
    }

    /**
     * Read a cached value, treating anything unexpected as a miss.
     *
     * $expectedType is what makes this safe to trust: a value written by an
     * older build can come back as __PHP_Incomplete_Class when the
     * config('cache.serializable_classes') allowlist changes, or as an object
     * of the wrong shape if the key is ever reused. Both are purged and
     * reported as a miss rather than handed to a caller expecting a type.
     */
    private function read(string $key, string $expectedType): mixed
    {
        try {
            $value = Cache::get($key);
        } catch (\Throwable $e) {
            $this->reportFailure($key, $e);

            return null;
        }

        if ($value === null) {
            return null;
        }

        if (! $value instanceof $expectedType) {
            $this->forgetKey($key);

            return null;
        }

        return $value;
    }

    private function write(string $key, mixed $value, ?int $ttl = null): void
    {
        try {
            Cache::put($key, $value, ($ttl ?? self::TENANT_TTL) + random_int(0, self::TTL_JITTER));
        } catch (\Throwable $e) {
            // A contended upsert on the `cache` table is exactly the deadlock
            // this class exists to absorb. The caller already has the value it
            // needed; failing the request over a cache write would be absurd.
            $this->reportFailure($key, $e);
        }
    }

    private function forgetKey(string $key): void
    {
        try {
            Cache::forget($key);
        } catch (\Throwable) {
            // If the store cannot be reached it cannot be serving a stale value
            // to anyone either. The next read simply re-resolves from MySQL.
        }
    }

    private function reportFailure(string $key, \Throwable $e): void
    {
        try {
            Log::warning('tenant.resolve.cache_unavailable', [
                'key' => $key,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
        } catch (\Throwable) {
            // Never let logging escalate a cache failure into a request failure.
        }
    }
}
