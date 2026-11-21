<?php

namespace App\Services\Payments;

use App\Models\Tenant;
use Illuminate\Http\Request;

/**
 * Builds customer-facing payment URLs from hosts that actually belong to the
 * current tenant. Callback URLs must never be derived from an arbitrary Host
 * or X-Forwarded-Host header, otherwise a caller can redirect a payment result
 * (and the gateway callback) to a domain they control.
 */
class TenantPaymentUrl
{
    public function forTenant(Tenant $tenant, Request $request): string
    {
        $hosts = array_values(array_filter(array_map(
            fn (mixed $value): string => $this->normalizeHost((string) $value),
            [
                $request->headers->get('X-Forwarded-Host'),
                $request->getHost(),
            ],
        )));

        $domain = $tenant->domains()
            ->where('status', 'active')
            ->whereIn('domain', $hosts)
            ->first();

        if (! $domain) {
            $domain = $tenant->domains()
                ->where('status', 'active')
                ->where('is_primary', true)
                ->first();
        }

        $host = $domain?->domain ?: $tenant->getDefaultDomain();

        return ($request->secure() ? 'https' : 'http').'://'.$host;
    }

    private function normalizeHost(string $host): string
    {
        // X-Forwarded-Host can contain a comma-separated proxy chain.
        $host = trim(explode(',', $host)[0] ?? '');
        if ($host === '') {
            return '';
        }

        $parsed = parse_url(str_starts_with($host, '//') ? $host : '//'.$host, PHP_URL_HOST);

        return is_string($parsed) ? mb_strtolower($parsed) : '';
    }
}
