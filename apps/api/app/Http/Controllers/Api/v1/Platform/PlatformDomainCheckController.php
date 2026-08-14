<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Repositories\TenantRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PlatformDomainCheckController extends Controller
{
    public function __construct(private readonly TenantRepository $tenants) {}

    /**
     * On-demand TLS permission endpoint for Caddy.
     *
     * Caddy sends a GET to this URL with `?domain={hostname}` (and the
     * configured `secret`) whenever it needs to issue or renew a certificate
     * for an unknown hostname. A 2xx response approves issuance, anything
     * else denies it — so new platform subdomains and verified custom domains
     * get certificates automatically as soon as their tenant_domains record
     * is active.
     */
    public function check(Request $request): JsonResponse
    {
        $expectedSecret = (string) config('services.platform.domain_check_secret');
        $providedSecret = (string) $request->query('secret', '');

        if ($expectedSecret === '') {
            Log::warning('Domain check secret is not configured (DOMAIN_CHECK_SECRET).');

            return response()->json(['message' => 'Server is not configured for domain checks.'], 503);
        }

        if (! hash_equals($expectedSecret, $providedSecret)) {
            return response()->json(['message' => 'Invalid secret.'], 403);
        }

        $domain = trim((string) $request->query('domain', ''));

        if ($domain === '') {
            return response()->json(['message' => 'The domain parameter is required.'], 422);
        }

        $tenant = $this->tenants->findByDomain($domain);

        if (! $tenant) {
            return response()->json(['message' => 'Domain is not registered to an active tenant.'], 404);
        }

        return response()->json([
            'ok' => true,
            'tenant_id' => $tenant->id,
        ]);
    }
}
