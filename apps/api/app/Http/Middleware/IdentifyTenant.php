<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Repositories\TenantRepository;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentifyTenant
{
    public function __construct(private readonly TenantRepository $tenants)
    {
    }

    public function handle(Request $request, \Closure $next): Response
    {
        // 1. If the frontend sent an explicit X-Tenant-ID, resolve immediately.
        //    This bypasses the public-path check so that login requests carrying
        //    the header always pass through, regardless of any isPublicPath
        //    heuristics issue.
        $tenantId = trim((string) $request->header('X-Tenant-ID', ''));
        if ($tenantId !== '') {
            $tenant = $this->tenants->findById($tenantId);
            if ($tenant && $this->tenants->isActive((string) $tenant->id)) {
                app()->instance(Tenant::class, $tenant);
                app()->instance('currentTenant', $tenant);
                return $next($request);
            }
        }

        // 2. Public paths (login, password reset, etc.) are allowed without a tenant.
        if ($this->isPublicPath($request)) {
            return $next($request);
        }

        // 3. Domain hint header
        $domain = trim((string) $request->header('X-Tenant-Domain', ''));
        if ($domain !== '') {
            $tenant = $this->tenants->findByDomain($domain);
        }

        // 4. X-Forwarded-Host (proxy)
        if (! isset($tenant) || ! $tenant) {
            $forwardedHost = trim((string) $request->header('X-Forwarded-Host', ''));
            if ($forwardedHost !== '') {
                $tenant = $this->tenants->findByHostname($forwardedHost);
            }
        }

        // 5. Direct Host header
        if (! isset($tenant) || ! $tenant) {
            $hostname = $request->getHost();
            $tenant = $this->tenants->findByHostname($hostname);
        }

        if (! isset($tenant) || ! $tenant || ! $this->tenants->isActive((string) $tenant->id)) {
            return response()->json([
                'message' => 'Tenant not found or inactive.',
                'error' => 'TENANT_NOT_FOUND'
            ], 404);
        }

        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);

        return $next($request);
    }

    private function isPublicPath(Request $request): bool
    {
        $path = $request->path();

        return $request->is('api/platform/*')
            || $request->is('api/v1/platform/*')
            || $request->is('api/v1/certificates/verify/*')
            || $request->is('api/v1/integrations/bunny/webhooks')
            || $request->is('api/v1/payments/fawaterk/webhook_json')
            || $request->is('api/v1/tenant/by-domain')
            || $request->is('api/v1/auth/refresh')
            || $request->is('api/v1/tenant/auth/login')
            || $request->is('api/v1/tenant/auth/refresh')
            || $request->is('api/v1/tenant/auth/forgot-password')
            || $request->is('api/v1/tenant/auth/reset-password')
            || $request->is('api/v1/media/serve/*')
            // Catch-all: match by path suffix in case the API prefix
            // is not applied (e.g., Laravel 13+ default behaviour).
            || str_ends_with($path, '/tenant/auth/login')
            || str_ends_with($path, '/tenant/auth/refresh')
            || str_ends_with($path, '/tenant/auth/forgot-password')
            || str_ends_with($path, '/tenant/auth/reset-password')
            || str_ends_with($path, '/tenant/by-domain')
            || str_ends_with($path, '/auth/refresh')
            || str_ends_with($path, '/auth/login')
            // Liveness / readiness are unauthenticated infrastructure probes.
            || $request->is('api/v1/health/ready')
            || $request->is('api/v1/health/live')
            || $request->is('api/v1/health/*');
    }
}
