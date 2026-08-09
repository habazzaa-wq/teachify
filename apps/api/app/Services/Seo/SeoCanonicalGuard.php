<?php

namespace App\Services\Seo;

use App\Models\TenantDomain;

/**
 * Guards canonical URLs so teacher input can never point at another tenant,
 * platform admin pages, or arbitrary external hosts.
 *
 * Allowed:
 *  - null / empty (no explicit canonical → platform derives the default)
 *  - relative paths starting with "/" (same-origin)
 *  - absolute http(s) URLs whose host belongs to the current tenant's domains
 *    or matches the host the request itself was served from.
 *
 * Everything else is rejected server-side. Frontend validation is never trusted.
 */
class SeoCanonicalGuard
{
    /** @var list<string> */
    private const DENIED_HOSTS = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];

    public function assertSafe(?string $canonical): bool
    {
        return $this->isSafe($canonical);
    }

    public function isSafe(?string $canonical): bool
    {
        if ($canonical === null || trim($canonical) === '') {
            return true;
        }

        $value = trim($canonical);

        // Relative, same-origin path (normalized to the front).
        if (str_starts_with($value, '/')) {
            return ! str_starts_with($value, '//');
        }

        // Absolute URL.
        $parts = parse_url($value);
        if ($parts === false || ! isset($parts['scheme'], $parts['host'])) {
            return false;
        }

        $scheme = strtolower((string) $parts['scheme']);
        if (! in_array($scheme, ['http', 'https'], true)) {
            return false;
        }

        $host = strtolower((string) $parts['host']);
        if (in_array($host, self::DENIED_HOSTS, true)) {
            return false;
        }

        return $this->isTenantHost($host);
    }

    private function isTenantHost(string $host): bool
    {
        // The host the request was served on is always safe (it already
        // resolved to this tenant through the tenant middleware).
        $requestHost = strtolower((string) request()->getHost());
        if ($requestHost !== '' && ($host === $requestHost || str_ends_with($host, '.' . $requestHost))) {
            return true;
        }

        $tenantId = \currentTenant()->id;

        $allowed = TenantDomain::query()
            ->where('tenant_id', $tenantId)
            ->pluck('domain')
            ->map(fn ($d) => strtolower(trim((string) $d)))
            ->filter(fn ($d) => $d !== '')
            ->all();

        if ($allowed === []) {
            return false;
        }

        foreach ($allowed as $domain) {
            if ($host === $domain || str_ends_with($host, '.' . $domain)) {
                return true;
            }
        }

        return false;
    }
}
