# Custom Domain Auto-Verification - Implementation Plan

## Overview

Fully automated domain lifecycle: customer adds domain → scheduled job detects DNS → auto-provisions SSL via Caddy → domain goes active. Zero manual intervention.

---

## Files to Create (Backend)

| # | File | Purpose |
|---|------|---------|
| 1 | `database/migrations/2026_07_20_000000_enhance_tenant_domains_for_custom_domain_support.php` | Add new columns to tenant_domains |
| 2 | `database/migrations/2026_07_20_000001_create_domain_verification_logs_table.php` | Audit trail for domain verification events |
| 3 | `app/Services/Domain/DnsVerificationService.php` | DNS check (A/AAAA/CNAME) |
| 4 | `app/Services/Domain/SslCertificateService.php` | SSL cert probing + Caddy warm-up |
| 5 | `app/Services/Domain/DomainHealthService.php` | Health check for active domains |
| 6 | `app/Services/Domain/DomainCacheService.php` | Cache invalidation for domain resolution |
| 7 | `app/Services/Domain/VerificationLogService.php` | Writes domain_verification_logs |
| 8 | `app/Jobs/Domain/CheckPendingDomainsJob.php` | Scheduled every 2 min - checks DNS for pending domains |
| 9 | `app/Jobs/Domain/WarmSslCertificateJob.php` | Proactively fetches cert after DNS verified |
| 10 | `app/Jobs/Domain/ActivateDomainJob.php` | Sets status=active, invalidates cache |
| 11 | `app/Jobs/Domain/CheckSslExpirationJob.php` | Daily check for expiring certs |
| 12 | `app/Jobs/Domain/HealthCheckDomainsJob.php` | 6-hour health check for all active custom domains |
| 13 | `app/Console/Commands/DomainHealthCheckCommand.php` | Artisan command for manual health check |

## Files to Modify (Backend)

| # | File | Change |
|---|------|--------|
| 14 | `app/Models/TenantDomain.php` | Add new fillable fields and casts |
| 15 | `app/Http/Controllers/Api/v1/Platform/TenantDomainController.php` | Remove manual verify(), add status endpoint |
| 16 | `routes/api.php` | Add domain-check route for Caddy, add status route |
| 17 | `config/services.php` | Add `caddy.admin_url` and `platform.server_ip` |
| 18 | `routes/console.php` | Add scheduled jobs |

## Files to Modify (Frontend)

| # | File | Change |
|---|------|--------|
| 19 | `apps/web/src/features/domains/components/DomainRowActions.tsx` | Remove "Verify" button (auto-verification) |
| 20 | `apps/web/src/features/domains/components/DomainsTable.tsx` | Remove onVerify prop |
| 21 | `apps/web/src/features/domains/hooks/index.ts` | Remove useVerifyDomain hook |
| 22 | `apps/web/src/features/domains/services/index.ts` | Replace mock with real API calls, remove verify() |
| 23 | `apps/web/src/features/domains/components/DomainVerificationFlow.tsx` | Update for auto-flow (no manual trigger) |

## Files to Create (Deployment)

| # | File | Purpose |
|---|------|---------|
| 24 | `deploy/Caddyfile` | Production Caddy config with on-demand TLS |

## Files to Modify (Deployment)

| # | File | Change |
|---|------|--------|
| 25 | `deploy/deploy.sh` | Replace Nginx with Caddy |

---

## Detailed Changes

### 1. Migration: enhance_tenant_domains

```php
Schema::table('tenant_domains', function (Blueprint $table) {
    // DNS verification enhancements
    $table->string('verification_method')->nullable()->after('verification_token'); // 'dns_a', 'dns_aaaa', 'dns_cname', 'txt_record'
    $table->string('verification_type')->nullable()->after('verification_method'); // 'auto', 'manual'
    $table->string('expected_ip', 45)->nullable()->after('verification_type');
    $table->text('verification_errors')->nullable()->after('dns_checked_at');
    $table->timestamp('last_dns_check')->nullable()->after('dns_checked_at');

    // SSL enhancements
    $table->string('ssl_provider')->nullable()->after('ssl_status'); // 'letsencrypt', 'cloudflare', etc.
    $table->timestamp('ssl_issued_at')->nullable()->after('ssl_provider');
    $table->timestamp('ssl_expires_at')->nullable()->after('ssl_issued_at');
    $table->integer('ssl_renewal_attempts')->default(0)->after('ssl_expires_at');
    $table->text('ssl_last_error')->nullable()->after('ssl_renewal_attempts');
    $table->timestamp('ssl_last_check')->nullable()->after('ssl_last_error');

    // Health
    $table->timestamp('last_health_check_at')->nullable()->after('ssl_last_check');
    $table->integer('health_score')->default(0)->after('last_health_check_at');
});
```

### 2. TenantDomain model updates

Add all new fields to `$fillable` and `$casts`.

### 3. DnsVerificationService

```php
class DnsVerificationService
{
    // Checks A, AAAA, and CNAME records
    // Returns ['passed' => bool, 'type' => 'a'|'aaaa'|'cname', 'records' => [], 'error' => string|null]
    // Uses dns_get_record() with DNS_A, DNS_AAAA, DNS_CNAME
    // For CNAME: validates target matches platform domain
    // Gets server IP from config('services.platform.server_ip') with fallback to gethostbyname()
}
```

### 4. CheckPendingDomainsJob (the core auto-verification engine)

```
Runs every 2 minutes via scheduler.
Queries: TenantDomain::where('status', 'pending')->where('type', 'custom_domain')
For each domain:
  1. DnsVerificationService->verify()
  2. If DNS passes → update status='dns_verified', dispatch WarmSslCertificateJob
  3. If DNS fails → update last_dns_check, increment verification_errors
  4. Idempotent: skips domains already in non-pending status
  5. Lock mechanism: uses cache lock to prevent concurrent runs
```

### 5. WarmSslCertificateJob

```
Runs after DNS is verified.
1. Update ssl_status='pending'
2. Make HTTP request to https://{domain}/ to trigger Caddy's on-demand TLS
3. Verify cert was issued by checking SSL certificate info
4. If cert issued → dispatch ActivateDomainJob
5. If cert failed → update ssl_last_error, retry with backoff (5 tries, 120s backoff)
```

### 6. ActivateDomainJob

```
1. Set status='active', verified_at=now(), ssl_status='active'
2. DomainCacheService->invalidate(domain) → clears domain.owner.{domain} cache
3. Write verification log entry
```

### 7. DomainCacheService

```php
class DomainCacheService
{
    public function invalidate(string $domain): void
    {
        $normalized = mb_strtolower(trim($domain));
        Cache::forget("domain.owner.{$normalized}");
    }

    public function invalidateTenant(int $tenantId): void
    {
        // Find all domains for this tenant and invalidate each
        TenantDomain::where('tenant_id', $tenantId)
            ->pluck('domain')
            ->each(fn($d) => $this->invalidate($d));
    }
}
```

### 8. Caddyfile

```caddyfile
{
    on_demand_tls {
        ask http://127.0.0.1:3000/api/v1/platform/domain-check
        interval 10s
        burst 10
    }
}

teachify.tech, *.teachify.tech {
    tls /etc/letsencrypt/live/teachify.tech/fullchain.pem /etc/letsencrypt/live/teachify.tech/privkey.pem
    # ... full routing config (same as current Nginx but in Caddy syntax)
}

https:// {
    on_demand
    # ... same routing as platform block
}
```

### 9. Frontend changes

- Remove `onVerify` from DomainsTable, DomainRowActions
- Remove `useVerifyDomain` hook
- Replace `domainsService` mock with real API calls
- DomainVerificationFlow: shows automatic progress (pending → dns_found → ssl_requested → ssl_issued → active), no buttons

### 10. Scheduled Jobs (routes/console.php)

```php
Schedule::command('domain:check-pending')->everyTwoMinutes();
Schedule::command('domain:check-ssl-expiration')->dailyAt('03:00');
Schedule::command('domain:health-check')->everySixHours();
```

### 11. New routes (routes/api.php)

```php
// Caddy ask URL (internal, no auth)
Route::get('/v1/platform/domain-check', function (Request $request) {
    $domain = $request->query('domain');
    if (!$domain) return response()->json(['allowed' => false], 400);
    $exists = TenantDomain::where('domain', $domain)->where('status', 'active')->exists();
    return $exists ? response()->json(['allowed' => true]) : response()->json(['allowed' => false], 404);
});

// Domain status polling (tenant auth)
Route::get('/domains/{tenantDomain}/status', ...);
```

---

## Idempotency & Scalability Design

1. **Idempotent jobs**: Each job checks current status before acting. `CheckPendingDomainsJob` skips domains not in `pending` status. `WarmSslCertificateJob` skips if ssl_status is already `active`.

2. **Cache lock**: `CheckPendingDomainsJob` uses `Cache::lock('domain-check-pending', 60)` to prevent concurrent scheduler runs on multiple workers.

3. **Optimistic locking**: Status transitions are atomic (`where('status', 'pending')->update(['status' => 'dns_verified'])`). If two workers try to activate, only one succeeds.

4. **Horizontal scale**: Multiple queue workers can process different domains concurrently. The lock only prevents the SCHEDULED COMMAND from running simultaneously, not job processing.

5. **No IdentifyTenant changes**: The existing resolution flow works as-is. Once domain is `active` in tenant_domains, `findByHostname()` finds it immediately.

---

## Verification Order

```
[Every 2 min]
CheckPendingDomainsJob
  → queries pending custom_domain entries
  → for each: DnsVerificationService.verify()
    → A record? Check dns_get_record($domain, DNS_A)
    → AAAA? Check dns_get_record($domain, DNS_AAAA)
    → CNAME? Check dns_get_record($domain, DNS_CNAME), verify target
  → DNS passes → status='dns_verified', last_dns_check=now()
  → dispatch WarmSslCertificateJob

[WarmSslCertificateJob]
  → ssl_status='pending'
  → HTTP GET https://{domain}/api/diag/ping (triggers Caddy cert issuance)
  → verify cert info via stream_socket_client('ssl://...')
  → cert issued → dispatch ActivateDomainJob
  → cert failed → retry (5 tries, 120s backoff)

[ActivateDomainJob]
  → status='active', verified_at=now(), ssl_status='active'
  → DomainCacheService.invalidate(domain)
  → VerificationLogService.record(...)
```
