<?php

namespace App\Queue\Middleware;

use App\Models\Tenant;
use App\Repositories\TenantRepository;
use Closure;

/**
 * Establishes per-tenant context inside queue workers.
 *
 * HTTP requests receive tenant context from IdentifyTenant middleware, but
 * queue workers are independent long-lived processes with no request, so any
 * job touching BelongsToTenant models must bind the tenant itself.
 *
 * Jobs must carry a primitive tenant id (never a scoped Eloquent model):
 * SerializesModels restores model properties BEFORE job middleware runs,
 * which would trigger TenantScope -> currentTenant() while no context exists.
 *
 * The binding is always released in finally so a long-lived worker never
 * leaks one tenant's scope into subsequently processed jobs. Resolution goes
 * through TenantRepository so HTTP + queue share one cache key/invalidation
 * path ("tenant.{id}").
 */
class SetTenantContext
{
    public function __construct(
        private readonly int $tenantId,
    ) {}

    public function handle($job, Closure $next): void
    {
        $tenant = app(TenantRepository::class)->findById($this->tenantId);

        if ($tenant === null) {
            // Tenant removed between dispatch and processing. Fail loudly so
            // the job lands in failed_jobs instead of running unsafely.
            throw new \RuntimeException(
                "SetTenantContext: tenant [{$this->tenantId}] not found."
            );
        }

        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);

        try {
            $next($job);
        } finally {
            app()->forgetInstance(Tenant::class);
            app()->forgetInstance('currentTenant');
        }
    }
}
