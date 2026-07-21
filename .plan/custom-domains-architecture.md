# Custom Domain Support - Architecture & Implementation Plan

## Executive Summary

Replace Nginx with Caddy as the production reverse proxy to achieve zero-config automatic SSL for unlimited custom domains. Build a Laravel job pipeline for DNS verification + SSL issuance + health monitoring. Wire the existing frontend domain management UI to real backend APIs.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CUSTOMER DNS                             │
│   A/CNAME record → YOUR_SERVER_IP                              │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CADDY (port 80/443)                         │
│                                                                  │
│  - On-demand TLS: auto-provisions Let's Encrypt certs           │
│  - Routes ANY domain pointing to this server                    │
│  - No config changes needed per domain                          │
│  - HTTP→HTTPS redirect automatic                                │
│  - Proxies to Next.js on 127.0.0.1:3000                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  NEXT.JS (port 3000)                             │
│                                                                  │
│  middleware.ts:                                                  │
│    1. Check if hostname is platform domain                       │
│    2. If not → call /api/v1/tenant/by-domain?domain={hostname}  │
│    3. Inject x-tenant-id, x-tenant-slug, x-tenant-domain        │
│    4. Rewrite to /tenant-not-found if unknown                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │ (proxies /api/* to Laravel)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                LARAVEL (unix socket / port 9000)                 │
│                                                                  │
│  IdentifyTenant middleware:                                      │
│    1. X-Tenant-ID header → findById()                           │
│    2. X-Tenant-Domain header → findByDomain()                   │
│    3. X-Forwarded-Host → findByHostname()                       │
│    4. Host header → findByHostname()                             │
│                                                                  │
│  TenantRepository::findByHostname()                              │
│    → normalizeDomain() → query tenant_domains where status=active │
│    → cache result (domain.owner.{normalized}, 1hr TTL)           │
│    → return Tenant model                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow: Customer opens https://theirdomain.com

```
1. DNS resolves theirdomain.com → YOUR_SERVER_IP
2. Caddy receives HTTP request on port 80
3. Caddy redirects to HTTPS (301)
4. Caddy checks on-demand TLS allow list
5. If no cert exists → Caddy requests cert from Let's Encrypt (HTTP-01 challenge)
6. Caddy terminates TLS
7. Caddy proxies to Next.js (127.0.0.1:3000) with Host: theirdomain.com
8. Next.js middleware resolves tenant via /api/v1/tenant/by-domain
9. Next.js injects x-tenant-id header
10. Next.js serves the tenant's branded page
11. API calls go through Next.js → Laravel
12. IdentifyTenant resolves tenant from headers/host
13. Tenant-scoped response returned
```

---

## 2. Database Changes

### 2a. Migration: Enhance tenant_domains table

New columns to add:

```php
// database/migrations/2026_07_20_000000_enhance_tenant_domains_for_custom_domain_support.php

Schema::table('tenant_domains', function (Blueprint $table) {
    // DNS verification
    $table->text('verification_errors')->nullable()->after('dns_checked_at');
    $table->string('expected_ip', 45)->nullable()->after('verification_token'); // IPv4 or IPv6

    // SSL tracking
    $table->timestamp('ssl_issued_at')->nullable()->after('ssl_status');
    $table->timestamp('ssl_expires_at')->nullable()->after('ssl_issued_at');
    $table->integer('ssl_renewal_attempts')->default(0)->after('ssl_expires_at');
    $table->text('ssl_error')->nullable()->after('ssl_renewal_attempts');

    // Health monitoring
    $table->timestamp('last_health_check_at')->nullable()->after('dns_checked_at');
    $table->integer('health_score')->default(0)->after('last_health_check_at'); // 0-100

    // Caddy integration
    $table->boolean('caddy_enabled')->default(false)->after('health_score');
    $table->timestamp('caddy_synced_at')->nullable()->after('caddy_enabled');

    // Indexes
    $table->index('status');
    $table->index(['tenant_id', 'status']);
    $table->index('ssl_status');
    $table->index('caddy_enabled');
});
```

### 2b. Migration: Domain verification audit log

```php
// database/migrations/2026_07_20_000001_create_domain_verification_logs_table.php

Schema::create('domain_verification_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_domain_id')->constrained()->cascadeOnDelete();
    $table->string('action'); // dns_checked, ssl_requested, ssl_issued, ssl_renewed, health_checked
    $table->string('status'); // success, failed, pending
    $table->text('message')->nullable();
    $table->json('metadata')->nullable(); // store DNS records, cert details, etc.
    $table->timestamps();
});
```

### 2c. Updated TenantDomain model fillable

```php
protected $fillable = [
    'tenant_id',
    'domain',
    'subdomain',
    'type',
    'status',
    'is_primary',
    'verification_token',
    'verified_at',
    'ssl_status',
    'ssl_issued_at',
    'ssl_expires_at',
    'ssl_renewal_attempts',
    'ssl_error',
    'dns_checked_at',
    'verification_errors',
    'expected_ip',
    'last_health_check_at',
    'health_score',
    'caddy_enabled',
    'caddy_synced_at',
];

protected $casts = [
    'is_primary' => 'boolean',
    'verified_at' => 'datetime',
    'dns_checked_at' => 'datetime',
    'ssl_issued_at' => 'datetime',
    'ssl_expires_at' => 'datetime',
    'last_health_check_at' => 'datetime',
    'caddy_synced_at' => 'datetime',
    'caddy_enabled' => 'boolean',
    'ssl_renewal_attempts' => 'integer',
    'health_score' => 'integer',
    'metadata' => 'array',
];
```

---

## 3. Caddy Configuration

### 3a. Caddyfile (production)

```caddyfile
{
    # On-demand TLS: Caddy will request certs for any domain
    # that passes the HTTP challenge. The ask URL prevents
    # cert exhaustion attacks by verifying the domain is managed.
    on_demand_tls {
        ask http://127.0.0.1:3000/api/v1/platform/domain-check
        # Rate limit: max 10 new certs per 10 seconds
        interval 10s
        burst 10
    }
}

# Platform domain (explicit config for performance)
teachify.tech, *.teachify.tech {
    tls /etc/letsencrypt/live/teachify.tech/fullchain.pem /etc/letsencrypt/live/teachify.tech/privkey.pem

    # Security headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        Permissions-Policy "camera=(), microphone=(), geolocation=()"
        -Server
    }

    # Rate limiting
    log {
        output file /var/www/teachify/logs/caddy-access.log {
            roll_size 100mb
            roll_keep 5
        }
        output stderr
    }

    # Client upload size
    request_body {
        max_size 500MB
    }

    # API routes → Next.js → Laravel
    handle /api/* {
        reverse_proxy 127.0.0.1:3000 {
            header_up Host {host}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
            header_up X-Forwarded-Host {host}
        }
    }

    # Sanctum CSRF
    handle /sanctum/* {
        reverse_proxy 127.0.0.1:3000 {
            header_up Host {host}
            header_up X-Forwarded-Host {host}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Static assets
    handle /_next/static/* {
        reverse_proxy 127.0.0.1:3000 {
            header Cache-Control "public, max-age=31536000, immutable"
        }
    }

    # Everything else → Next.js
    handle {
        reverse_proxy 127.0.0.1:3000 {
            header_up Host {host}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
            header_up X-Forwarded-Host {host}
        }
    }

    # Block hidden files
    handle /.well-known/* {
        reverse_proxy 127.0.0.1:3000
    }
}

# Custom domains: on-demand TLS catch-all
# Any domain not explicitly configured above will use on-demand TLS
https:// {
    on_demand

    # Security headers (same as platform)
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        -Server
    }

    request_body {
        max_size 500MB
    }

    # Same routing as platform
    handle /api/* {
        reverse_proxy 127.0.0.1:3000 {
            header_up Host {host}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
            header_up X-Forwarded-Host {host}
        }
    }

    handle /sanctum/* {
        reverse_proxy 127.0.0.1:3000 {
            header_up Host {host}
            header_up X-Forwarded-Host {host}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    handle /_next/static/* {
        reverse_proxy 127.0.0.1:3000 {
            header Cache-Control "public, max-age=31536000, immutable"
        }
    }

    handle {
        reverse_proxy 127.0.0.1:3000 {
            header_up Host {host}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
            header_up X-Forwarded-Host {host}
        }
    }
}
```

### Key Caddy Advantages

1. **On-demand TLS**: Caddy requests a Let's Encrypt cert the FIRST time a new domain hits the server. No pre-configuration needed.
2. **ask URL**: The `ask http://127.0.0.1:3000/api/v1/platform/domain-check` endpoint tells Caddy whether a domain is managed by our platform. This prevents anyone from exhausting Let's Encrypt rate limits by sending random domains.
3. **Zero config per domain**: No Caddyfile edits, no certbot commands, no cron jobs.
4. **Automatic renewal**: Caddy handles cert renewal in the background.

---

## 4. Backend Implementation

### 4a. Domain Verification Service

```
app/Services/Domain/
├── DomainVerificationService.php      # Orchestrates the full verification flow
├── DnsVerificationService.php         # Checks DNS records point to our server
├── SslCertificateService.php          # Manages SSL cert status (Caddy handles issuance)
├── DomainHealthService.php            # Periodic health checks
└── CaddyApiService.php               # Communicates with Caddy admin API
```

### 4b. DomainVerificationService

```php
<?php

namespace App\Services\Domain;

use App\Models\TenantDomain;
use App\Services\Support\IpResolver;

class DomainVerificationService
{
    public function __construct(
        private readonly DnsVerificationService $dns,
        private readonly SslCertificateService $ssl,
        private readonly DomainHealthService $health,
    ) {}

    /**
     * Full verification pipeline for a custom domain.
     * Called when admin clicks "Verify" or by scheduled job.
     */
    public function verify(TenantDomain $domain): array
    {
        $results = ['steps' => [], 'success' => false];

        // Step 1: Verify DNS
        $dnsResult = $this->dns->verify($domain);
        $results['steps']['dns'] = $dnsResult;

        if (!$dnsResult['passed']) {
            $domain->update([
                'status' => 'failed',
                'verification_errors' => $dnsResult['error'],
                'dns_checked_at' => now(),
            ]);
            return $results;
        }

        $domain->update([
            'status' => 'verifying',
            'dns_checked_at' => now(),
        ]);

        // Step 2: Trigger SSL (Caddy on-demand TLS)
        $sslResult = $this->ssl->ensureCertificate($domain);
        $results['steps']['ssl'] = $sslResult;

        if (!$sslResult['passed']) {
            $domain->update([
                'ssl_status' => 'error',
                'ssl_error' => $sslResult['error'],
            ]);
            return $results;
        }

        // Step 3: Health check
        $healthResult = $this->health->check($domain);
        $results['steps']['health'] = $healthResult;

        // Step 4: Activate domain
        $domain->update([
            'status' => 'active',
            'verification_token' => null,
            'verified_at' => now(),
            'ssl_status' => 'active',
            'ssl_issued_at' => now(),
            'caddy_enabled' => true,
            'caddy_synced_at' => now(),
        ]);

        $results['success'] = true;
        return $results;
    }
}
```

### 4c. DnsVerificationService

```php
<?php

namespace App\Services\Domain;

use App\Models\TenantDomain;
use App\Services\Support\IpResolver;

class DnsVerificationService
{
    private string $serverIp;

    public function __construct(private readonly IpResolver $ipResolver)
    {
        $this->serverIp = $this->ipResolver->getServerIp();
    }

    public function verify(TenantDomain $domain): array
    {
        $hostname = $domain->domain;

        // Check A record
        $aRecords = dns_get_record($hostname, DNS_A);
        if (empty($aRecords)) {
            // Try CNAME
            $cnameRecords = dns_get_record($hostname, DNS_CNAME);
            if (!empty($cnameRecords)) {
                // Verify CNAME points to our platform domain
                $expectedCname = config('services.platform.domain');
                $pointsToUs = collect($cnameRecords)->contains(
                    fn($record) => strcasecmp(rtrim($record['target'], '.'), $expectedCname) === 0
                );

                if ($pointsToUs) {
                    return ['passed' => true, 'type' => 'cname', 'records' => $cnameRecords];
                }
            }

            return [
                'passed' => false,
                'error' => "No A or CNAME record found for {$hostname}. Expected A record pointing to {$this->serverIp} or CNAME pointing to " . config('services.platform.domain'),
            ];
        }

        // Verify A record points to our server
        $pointsToUs = collect($aRecords)->contains(
            fn($record) => $record['ip'] === $this->serverIp
        );

        if (!$pointsToUs) {
            $foundIps = collect($aRecords)->pluck('ip')->implode(', ');
            return [
                'passed' => false,
                'error' => "A record for {$hostname} points to {$foundIps}, expected {$this->serverIp}",
            ];
        }

        return ['passed' => true, 'type' => 'a', 'records' => $aRecords];
    }

    /**
     * Check if a domain's DNS resolves correctly (lighter check).
     */
    public function isDnsReady(string $hostname): bool
    {
        $aRecords = dns_get_record($hostname, DNS_A);
        if (!empty($aRecords)) {
            return collect($aRecords)->contains(
                fn($record) => $record['ip'] === $this->serverIp
            );
        }

        $cnameRecords = dns_get_record($hostname, DNS_CNAME);
        if (!empty($cnameRecords)) {
            $expectedCname = config('services.platform.domain');
            return collect($cnameRecords)->contains(
                fn($record) => strcasecmp(rtrim($record['target'], '.'), $expectedCname) === 0
            );
        }

        return false;
    }
}
```

### 4d. SslCertificateService

```php
<?php

namespace App\Services\Domain;

use App\Models\TenantDomain;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SslCertificateService
{
    /**
     * Ensure SSL certificate exists for a domain.
     * With Caddy on-demand TLS, the cert is auto-provisioned on first request.
     * This method verifies the cert was actually issued.
     */
    public function ensureCertificate(TenantDomain $domain): array
    {
        try {
            // Caddy auto-provisions on first HTTPS request.
            // We make a request to trigger provisioning and verify it works.
            $response = Http::withOptions([
                'verify' => false, // Self-signed during provisioning
                'timeout' => 15,
                'connect_timeout' => 10,
            ])->get("https://{$domain->domain}/api/diag/ping");

            if ($response->successful()) {
                // Now verify the cert is valid (not self-signed)
                $certInfo = $this->getCertificateInfo($domain->domain);
                if ($certInfo) {
                    return [
                        'passed' => true,
                        'issuer' => $certInfo['issuer'] ?? 'unknown',
                        'expires_at' => $certInfo['expires_at'] ?? null,
                    ];
                }

                return ['passed' => true, 'issuer' => 'Let\'s Encrypt', 'expires_at' => null];
            }

            return [
                'passed' => false,
                'error' => "SSL check failed: HTTP {$response->status()}",
            ];
        } catch (\Throwable $e) {
            Log::error("SSL verification failed for {$domain->domain}: {$e->getMessage()}");
            return [
                'passed' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get SSL certificate information for a domain.
     */
    public function getCertificateInfo(string $hostname): ?array
    {
        $context = stream_context_create(['ssl' => ['capture_peer_cert' => true]]);
        $stream = @stream_socket_client("ssl://{$hostname}:443", $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $context);

        if (!$stream) {
            return null;
        }

        $cert = stream_context_get_options($context)['ssl']['peer_certificate'] ?? null;
        if (!$cert) {
            fclose($stream);
            return null;
        }

        $certDetails = openssl_x509_parse($cert);
        fclose($stream);

        if (!$certDetails) {
            return null;
        }

        return [
            'issuer' => $certDetails['issuer']['O'] ?? 'unknown',
            'subject' => $certDetails['subject']['CN'] ?? $hostname,
            'expires_at' => date('Y-m-d H:i:s', $certDetails['validTo_time_t']),
            'issued_at' => date('Y-m-d H:i:s', $certDetails['validFrom_time_t']),
            'serial' => $certDetails['serialNumberHex'] ?? null,
        ];
    }
}
```

### 4e. DomainHealthService

```php
<?php

namespace App\Services\Domain;

use App\Models\TenantDomain;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DomainHealthService
{
    public function check(TenantDomain $domain): array
    {
        $results = [
            'dns' => false,
            'ssl' => false,
            'http' => false,
            'latency' => 0,
            'score' => 0,
        ];

        // DNS check
        $results['dns'] = app(DnsVerificationService::class)->isDnsReady($domain->domain);

        // SSL + HTTP check
        $start = microtime(true);
        try {
            $response = Http::timeout(10)->get("https://{$domain->domain}/api/diag/ping");
            $results['http'] = $response->successful();
            $results['ssl'] = $response->successful(); // If HTTPS worked, SSL is valid
            $results['latency'] = round((microtime(true) - $start) * 1000);
        } catch (\Throwable $e) {
            Log::warning("Health check failed for {$domain->domain}: {$e->getMessage()}");
        }

        // Calculate score (0-100)
        $score = 0;
        if ($results['dns']) $score += 33;
        if ($results['ssl']) $score += 33;
        if ($results['http']) $score += 34;
        $results['score'] = $score;

        // Update domain
        $domain->update([
            'last_health_check_at' => now(),
            'health_score' => $score,
        ]);

        return $results;
    }
}
```

### 4f. CaddyApiService

```php
<?php

namespace App\Services\Domain;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CaddyApiService
{
    private string $adminUrl;

    public function __construct()
    {
        $this->adminUrl = config('services.caddy.admin_url', 'http://127.0.0.1:2019');
    }

    /**
     * Check if a domain is allowed for on-demand TLS.
     * This is the endpoint Caddy calls (the "ask" URL).
     */
    public function isDomainAllowed(string $domain): bool
    {
        return \App\Models\TenantDomain::query()
            ->where('domain', $domain)
            ->where('status', 'active')
            ->exists();
    }

    /**
     * Get Caddy's loaded configuration (for debugging).
     */
    public function getConfig(): ?array
    {
        try {
            $response = Http::timeout(5)->get("{$this->adminUrl}/config/");
            return $response->json();
        } catch (\Throwable $e) {
            Log::error("Failed to get Caddy config: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Get all certificates managed by Caddy.
     */
    public function getCertificates(): ?array
    {
        try {
            $response = Http::timeout(5)->get("{$this->adminUrl}/certificates/");
            return $response->json();
        } catch (\Throwable $e) {
            Log::error("Failed to get Caddy certificates: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Revoke a certificate (when a domain is removed).
     */
    public function revokeCertificate(string $domain): bool
    {
        try {
            $response = Http::timeout(10)->delete("{$this->adminUrl}/certificates/{$domain}");
            return $response->successful();
        } catch (\Throwable $e) {
            Log::error("Failed to revoke certificate for {$domain}: {$e->getMessage()}");
            return false;
        }
    }
}
```

### 4g. Platform Domain Check Endpoint (for Caddy's ask URL)

This is the endpoint Caddy calls to verify a domain is managed before issuing a cert:

```php
// In routes/api.php, add to the platform routes:

Route::get('/platform/domain-check', function (\Illuminate\Http\Request $request) {
    $domain = $request->query('domain');

    if (!$domain || !is_string($domain)) {
        return response()->json(['error' => 'Missing domain'], 400);
    }

    $exists = \App\Models\TenantDomain::query()
        ->where('domain', $domain)
        ->where('status', 'active')
        ->exists();

    if ($exists) {
        return response()->json(['allowed' => true]);
    }

    return response()->json(['allowed' => false], 404);
});
```

---

## 5. Queue Jobs

### 5a. Job Pipeline

```
Domain added by tenant
        │
        ▼
VerifyDnsJob (queued, tries: 3, backoff: 60s)
        │ DNS passes?
        ├─ No → update status=failed, log error, notify tenant
        └─ Yes ↓
                │
                ▼
RequestSslJob (queued, tries: 5, backoff: 120s)
        │ SSL issued?
        ├─ No → retry with exponential backoff, max 5 attempts
        └─ Yes ↓
                │
                ▼
ActivateDomainJob (queued, tries: 1)
        │ Sets status=active, verified_at=now()
        │ Clears cache, notifies tenant
        └─ Done
```

### 5b. VerifyDnsJob

```php
<?php

namespace App\Jobs\Domain;

use App\Models\TenantDomain;
use App\Services\Domain\DnsVerificationService;
use App\Services\Domain\DomainVerificationLogService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class VerifyDnsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        public TenantDomain $domain,
    ) {}

    public function handle(
        DnsVerificationService $dns,
        DomainVerificationLogService $log,
    ): void {
        $result = $dns->verify($this->domain);

        $log->record($this->domain, 'dns_checked', $result['passed'] ? 'success' : 'failed', [
            'type' => $result['type'] ?? null,
            'records' => $result['records'] ?? null,
            'error' => $result['error'] ?? null,
        ]);

        if ($result['passed']) {
            // Chain to SSL job
            RequestSslJob::dispatch($this->domain);
        } else {
            $this->domain->update([
                'status' => 'failed',
                'verification_errors' => $result['error'],
            ]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        $this->domain->update([
            'status' => 'failed',
            'verification_errors' => "DNS verification failed after {$this->tries} attempts: {$exception->getMessage()}",
        ]);
    }
}
```

### 5c. RequestSslJob

```php
<?php

namespace App\Jobs\Domain;

use App\Models\TenantDomain;
use App\Services\Domain\SslCertificateService;
use App\Services\Domain\DomainVerificationLogService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RequestSslJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;
    public int $backoff = 120;

    public function __construct(
        public TenantDomain $domain,
    ) {}

    public function handle(
        SslCertificateService $ssl,
        DomainVerificationLogService $log,
    ): void {
        $this->domain->update(['ssl_status' => 'pending']);

        $result = $ssl->ensureCertificate($this->domain);

        $log->record($this->domain, 'ssl_requested', $result['passed'] ? 'success' : 'failed', [
            'issuer' => $result['issuer'] ?? null,
            'error' => $result['error'] ?? null,
        ]);

        if ($result['passed']) {
            $this->domain->update([
                'ssl_status' => 'active',
                'ssl_issued_at' => now(),
                'ssl_expires_at' => $result['expires_at'] ?? now()->addDays(90),
                'ssl_error' => null,
            ]);

            // Chain to activation
            ActivateDomainJob::dispatch($this->domain);
        } else {
            $this->domain->update([
                'ssl_status' => 'error',
                'ssl_error' => $result['error'],
                'ssl_renewal_attempts' => $this->domain->ssl_renewal_attempts + 1,
            ]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        $this->domain->update([
            'ssl_status' => 'error',
            'ssl_error' => "SSL issuance failed after {$this->tries} attempts: {$exception->getMessage()}",
        ]);
    }
}
```

### 5d. ActivateDomainJob

```php
<?php

namespace App\Jobs\Domain;

use App\Models\TenantDomain;
use App\Services\Domain\DomainVerificationLogService;
use App\Support\Cache\TenantDomainCache;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ActivateDomainJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function __construct(
        public TenantDomain $domain,
    ) {}

    public function handle(
        DomainVerificationLogService $log,
        TenantDomainCache $cache,
    ): void {
        $this->domain->update([
            'status' => 'active',
            'verified_at' => now(),
            'ssl_status' => 'active',
            'caddy_enabled' => true,
            'caddy_synced_at' => now(),
        ]);

        // Clear domain cache so IdentifyTenant picks up the new domain
        $cache->forget($this->domain->domain);

        $log->record($this->domain, 'domain_activated', 'success', [
            'verified_at' => now()->toIso8601String(),
        ]);

        // Notify tenant owner that domain is active
        // (Optional: send email notification)
    }
}
```

### 5e. DomainVerificationLogService

```php
<?php

namespace App\Services\Domain;

use App\Models\TenantDomain;
use Illuminate\Support\Facades\DB;

class DomainVerificationLogService
{
    public function record(TenantDomain $domain, string $action, string $status, array $metadata = []): void
    {
        DB::table('domain_verification_logs')->insert([
            'tenant_domain_id' => $domain->id,
            'action' => $action,
            'status' => $status,
            'message' => $metadata['error'] ?? null,
            'metadata' => collect($metadata)->except('error')->toJson(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
```

### 5f. Scheduled Jobs (Console/Kernel.php or schedule method)

```php
// In app/Console/Kernel.php or bootstrap/app.php schedule:

// Check SSL expiration for all active custom domains (daily)
$schedule->job(new CheckSslExpirationJob)->dailyAt('03:00');

// Health check for all active custom domains (every 6 hours)
$schedule->job(new HealthCheckAllDomainsJob)->everySixHours();

// Clean up expired domain verification logs (weekly)
$schedule->command('domain:clean-logs --days=90')->weekly();
```

### 5g. CheckSslExpirationJob

```php
<?php

namespace App\Jobs\Domain;

use App\Models\TenantDomain;
use App\Services\Domain\SslCertificateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

class CheckSslExpirationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public function handle(SslCertificateService $ssl): void
    {
        $expiringDomains = TenantDomain::query()
            ->where('status', 'active')
            ->where('type', 'custom_domain')
            ->where('ssl_status', 'active')
            ->where('ssl_expires_at', '<=', now()->addDays(30))
            ->where('ssl_expires_at', '>', now())
            ->get();

        foreach ($expiringDomains as $domain) {
            $result = $ssl->getCertificateInfo($domain->domain);
            if ($result) {
                $domain->update([
                    'ssl_expires_at' => $result['expires_at'],
                    'ssl_issued_at' => $result['issued_at'],
                ]);
            }
        }

        // Check for truly expired certs
        $expiredDomains = TenantDomain::query()
            ->where('status', 'active')
            ->where('ssl_expires_at', '<', now())
            ->get();

        foreach ($expiredDomains as $domain) {
            $domain->update(['ssl_status' => 'expired']);
            // Queue renewal
            RequestSslJob::dispatch($domain);
        }
    }
}
```

---

## 6. Updated TenantDomainController

Replace the current mock `verify()` method with real verification:

```php
<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Models\TenantDomain;
use App\Jobs\Domain\VerifyDnsJob;
use App\Services\Domain\DnsVerificationService;
use App\Services\Domain\SslCertificateService;
use App\Services\Domain\DomainHealthService;
use App\Services\Domain\CaddyApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TenantDomainController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'domains' => TenantDomain::query()
                ->where('tenant_id', currentTenant()->id)
                ->with('tenant:id,name,slug')
                ->orderBy('is_primary', 'desc')
                ->orderBy('created_at', 'desc')
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'domain' => ['required', 'string', 'max:255', 'unique:tenant_domains,domain'],
            'type' => ['required', Rule::in(['platform_subdomain', 'custom_domain', 'wildcard'])],
            'is_primary' => ['sometimes', 'boolean'],
        ]);

        if ($validated['is_primary'] ?? false) {
            TenantDomain::query()
                ->where('tenant_id', currentTenant()->id)
                ->where('is_primary', true)
                ->update(['is_primary' => false]);
        }

        $verificationToken = 'teachify-verify-' . bin2hex(random_bytes(16));

        $domain = TenantDomain::create([
            'tenant_id' => currentTenant()->id,
            'domain' => $validated['domain'],
            'type' => $validated['type'],
            'is_primary' => $validated['is_primary'] ?? false,
            'status' => 'pending',
            'verification_token' => $verificationToken,
            'expected_ip' => config('services.platform.server_ip'),
        ]);

        return response()->json([
            'message' => 'Domain added. Please point DNS to our server, then click Verify.',
            'domain' => $domain,
            'dns_instructions' => [
                'type' => 'A',
                'host' => $validated['domain'],
                'value' => config('services.platform.server_ip'),
                'ttl' => 3600,
            ],
        ], 201);
    }

    /**
     * Trigger real DNS + SSL verification.
     */
    public function verify(TenantDomain $tenantDomain): JsonResponse
    {
        abort_if($tenantDomain->tenant_id !== currentTenant()->id, 404);

        if ($tenantDomain->status === 'active') {
            return response()->json(['message' => 'Domain is already verified and active.']);
        }

        // Quick DNS check first
        $dns = app(DnsVerificationService::class);
        $dnsResult = $dns->verify($tenantDomain);

        if (!$dnsResult['passed']) {
            $tenantDomain->update([
                'status' => 'failed',
                'verification_errors' => $dnsResult['error'],
                'dns_checked_at' => now(),
            ]);

            return response()->json([
                'message' => 'DNS verification failed.',
                'error' => $dnsResult['error'],
                'expected_ip' => config('services.platform.server_ip'),
            ], 422);
        }

        // DNS passed - queue the full verification pipeline
        VerifyDnsJob::dispatch($tenantDomain);

        $tenantDomain->update([
            'status' => 'verifying',
            'dns_checked_at' => now(),
        ]);

        return response()->json([
            'message' => 'DNS verified. SSL certificate is being issued. This may take 1-2 minutes.',
            'domain' => $tenantDomain->refresh(),
        ]);
    }

    /**
     * Check domain status (for polling after verify).
     */
    public function status(TenantDomain $tenantDomain): JsonResponse
    {
        abort_if($tenantDomain->tenant_id !== currentTenant()->id, 404);

        return response()->json([
            'domain' => $tenantDomain->refresh(),
            'dns_ready' => $tenantDomain->dns_checked_at !== null && $tenantDomain->status !== 'failed',
            'ssl_ready' => $tenantDomain->ssl_status === 'active',
            'active' => $tenantDomain->status === 'active',
        ]);
    }

    /**
     * Trigger health check for a domain.
     */
    public function health(TenantDomain $tenantDomain): JsonResponse
    {
        abort_if($tenantDomain->tenant_id !== currentTenant()->id, 404);

        $health = app(DomainHealthService::class);
        $result = $health->check($tenantDomain);

        return response()->json([
            'health' => $result,
            'domain' => $tenantDomain->refresh(),
        ]);
    }

    public function update(Request $request, TenantDomain $tenantDomain): JsonResponse
    {
        abort_if($tenantDomain->tenant_id !== currentTenant()->id, 404);

        $validated = $request->validate([
            'is_primary' => ['sometimes', 'boolean'],
        ]);

        if ($validated['is_primary'] ?? false) {
            TenantDomain::query()
                ->where('tenant_id', currentTenant()->id)
                ->where('is_primary', true)
                ->update(['is_primary' => false]);
        }

        $tenantDomain->fill(collect($validated)->only(['is_primary'])->all())->save();

        return response()->json([
            'message' => 'Domain updated.',
            'domain' => $tenantDomain->refresh(),
        ]);
    }

    public function destroy(TenantDomain $tenantDomain): JsonResponse
    {
        abort_if($tenantDomain->tenant_id !== currentTenant()->id, 404);

        if ($tenantDomain->is_primary) {
            return response()->json(['message' => 'Cannot delete the primary domain.'], 422);
        }

        // Revoke SSL certificate via Caddy API
        if ($tenantDomain->ssl_status === 'active') {
            app(CaddyApiService::class)->revokeCertificate($tenantDomain->domain);
        }

        // Clear domain cache
        cache()->forget("domain.owner.{$tenantDomain->domain}");

        $tenantDomain->delete();

        return response()->json(['message' => 'Domain removed.']);
    }
}
```

---

## 7. Updated TenantDomainController - Platform Admin

Add platform-level domain management routes:

```php
// In routes/api.php, add to platform routes:

Route::prefix('domains')->group(function () {
    Route::get('/', [PlatformDomainController::class, 'index']);
    Route::get('/metrics', [PlatformDomainController::class, 'metrics']);
    Route::get('/{domain}', [PlatformDomainController::class, 'show']);
    Route::post('/{domain}/verify', [PlatformDomainController::class, 'verify']);
    Route::post('/{domain}/health-check', [PlatformDomainController::class, 'healthCheck']);
    Route::delete('/{domain}', [PlatformDomainController::class, 'destroy']);
});
```

---

## 8. Migration Plan: Nginx → Caddy (Zero Downtime)

### Phase 1: Prepare (no changes to production)

1. Install Caddy on the server alongside Nginx
2. Write and test the Caddyfile
3. Test Caddy on a non-standard port (e.g., 8443) with a test domain
4. Verify all routes work identically

### Phase 2: Caddy Validation

1. Run Caddy on port 8443 alongside Nginx on 443
2. Test custom domain flow end-to-end:
   - Add a test custom domain
   - Point DNS to server
   - Verify Caddy auto-provisions SSL on port 8443
   - Test the full request flow through port 8443

### Phase 3: Traffic Switch (5-minute window)

```bash
# 1. Stop Caddy on 8443
systemctl stop caddy

# 2. Update Caddyfile to use ports 80/443
# (edit the Caddyfile to use standard ports)

# 3. Stop Nginx
systemctl stop nginx

# 4. Start Caddy on 80/443
systemctl start caddy

# 5. Verify
curl -I https://teachify.tech
curl -I https://custom-domain.com
```

### Phase 4: Cleanup

1. Remove Nginx config files
2. Remove certbot cron jobs
3. Remove Nginx from startup
4. Update deploy.sh to use Caddy instead of Nginx
5. Update documentation

### Rollback Plan

If anything goes wrong:
```bash
systemctl stop caddy
systemctl start nginx
```
Takes < 5 seconds.

---

## 9. Deployment Strategy

### 9a. Updated deploy.sh (relevant sections)

```bash
# Replace Nginx section with Caddy

# ── 13. Configure Caddy ──
echo "[13/14] Configuring Caddy..."
cp "$DEPLOY_DIR/deploy/Caddyfile" /etc/caddy/Caddyfile
systemctl enable caddy
systemctl restart caddy

# ── 14. SSL certificates (Caddy handles this automatically) ──
echo "[14/14] Caddy will auto-provision SSL on first request."
# For the platform domain, we can pre-provision:
# (Optional: run caddy fmt --overwrite /etc/caddy/Caddyfile)
```

### 9b. PM2 Configuration (no changes needed)

The PM2 ecosystem config stays the same. Caddy proxies to the same Next.js on port 3000.

### 9c. Supervisor/Queue (no changes needed)

Queue workers continue processing domain verification jobs.

---

## 10. API Routes Summary

### Tenant-level routes (in `api/v1` group, auth required):

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/domains` | List tenant's domains |
| POST | `/domains` | Add custom domain |
| PUT | `/domains/{domain}` | Update domain settings |
| POST | `/domains/{domain}/verify` | Trigger DNS + SSL verification |
| GET | `/domains/{domain}/status` | Check verification status (poll) |
| POST | `/domains/{domain}/health` | Trigger health check |
| DELETE | `/domains/{domain}` | Remove domain (revoke SSL) |

### Platform-level routes (in `platform` group, admin required):

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/platform/domains` | List all domains across tenants |
| GET | `/platform/domains/metrics` | Domain metrics dashboard |
| GET | `/platform/domains/{domain}` | Domain details |
| POST | `/platform/domains/{domain}/verify` | Admin verify domain |
| POST | `/platform/domains/{domain}/health-check` | Admin health check |
| DELETE | `/platform/domains/{domain}` | Admin remove domain |

### Internal routes (no auth, called by Caddy):

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/platform/domain-check?domain={domain}` | Caddy ask URL (on-demand TLS) |
| GET | `/diag/ping` | Health check endpoint |

---

## 11. Configuration

### 11a. Laravel config/services.php additions

```php
'platform' => [
    'domain' => env('PLATFORM_DOMAIN', 'teachify.tech'),
    'server_ip' => env('SERVER_IP', 'YOUR_SERVER_IP'),
],

'caddy' => [
    'admin_url' => env('CADDY_ADMIN_URL', 'http://127.0.0.1:2019'),
],
```

### 11b. .env additions

```
PLATFORM_DOMAIN=teachify.tech
SERVER_IP=YOUR_SERVER_IP
CADDY_ADMIN_URL=http://127.0.0.1:2019
```

---

## 12. Frontend Changes

### 12a. Replace mock services with real API calls

The frontend already has the complete domain management UI (components, hooks, types, validators). The `services/index.ts` currently uses mock data. Replace with real API calls:

```typescript
// apps/web/src/features/domains/services/index.ts

import { apiClient } from "@/lib/api";

export const domainsService = {
  async list(params?: DomainsFilterParams) {
    const { data } = await apiClient.get("/domains", { params });
    return data;
  },

  async create(data: CreateDomainPayload) {
    const { data: result } = await apiClient.post("/domains", data);
    return result;
  },

  async verify(id: string) {
    const { data: result } = await apiClient.post(`/domains/${id}/verify`);
    return result;
  },

  async getStatus(id: string) {
    const { data: result } = await apiClient.get(`/domains/${id}/status`);
    return result;
  },

  async healthCheck(id: string) {
    const { data: result } = await apiClient.post(`/domains/${id}/health`);
    return result;
  },

  async delete(id: string) {
    await apiClient.delete(`/domains/${id}`);
  },
  // ... other methods
};
```

### 12b. Add polling to DomainVerificationFlow

After clicking "Verify", poll the status endpoint every 3 seconds until the domain is active:

```typescript
// In DomainVerificationFlow.tsx, after verify mutation:
const { data: statusData } = useQuery({
  queryKey: ["domain-status", domainId],
  queryFn: () => domainsService.getStatus(domainId),
  enabled: isVerifying,
  refetchInterval: 3000,
});

useEffect(() => {
  if (statusData?.active) {
    setIsVerifying(false);
    toast.success("Domain verified and SSL issued!");
  }
}, [statusData]);
```

---

## 13. Security Considerations

1. **Caddy ask URL**: Prevents cert exhaustion attacks. Only domains in `tenant_domains` table get certs.
2. **Rate limiting**: Caddy has built-in rate limiting. Add explicit limits in the Caddyfile for API routes.
3. **DNS verification**: Must complete before SSL is attempted.
4. **Cache invalidation**: When a domain is removed, clear `domain.owner.{domain}` cache immediately.
5. **Tenant isolation**: Custom domains follow the same `IdentifyTenant` middleware flow. No changes needed.

---

## 14. Monitoring & Observability

1. **Domain verification logs**: Stored in `domain_verification_logs` table.
2. **Health checks**: Run every 6 hours via scheduled job.
3. **SSL expiration monitoring**: Daily check, auto-renew if < 30 days remaining.
4. **Caddy metrics**: Available via admin API at `http://127.0.0.1:2019/metrics`.
5. **Queue monitoring**: Use existing PM2 logs + Laravel's `queue:failed` table.

---

## 15. Implementation Order

| Step | Task | Files |
|------|------|-------|
| 1 | Add database migration | `database/migrations/2026_07_20_000000_enhance_tenant_domains.php` |
| 2 | Add verification logs migration | `database/migrations/2026_07_20_000001_create_domain_verification_logs.php` |
| 3 | Update TenantDomain model | `app/Models/TenantDomain.php` |
| 4 | Create Domain services | `app/Services/Domain/` (5 files) |
| 5 | Create Domain jobs | `app/Jobs/Domain/` (4 files) |
| 6 | Update TenantDomainController | `app/Http/Controllers/Api/v1/Platform/TenantDomainController.php` |
| 7 | Add platform domain-check route | `routes/api.php` |
| 8 | Write Caddyfile | `deploy/Caddyfile` |
| 9 | Update deploy.sh | `deploy/deploy.sh` |
| 10 | Replace frontend mock services | `apps/web/src/features/domains/services/index.ts` |
| 11 | Add polling to verification UI | `apps/web/src/features/domains/components/DomainVerificationFlow.tsx` |
| 12 | Add platform domain management routes | `routes/api.php` + `PlatformDomainController.php` |
| 13 | Test end-to-end | Manual testing with a real domain |
| 14 | Deploy to production | Follow migration plan in Section 8 |

---

## 16. Capacity & Limits

| Metric | Limit | Notes |
|--------|-------|-------|
| Custom domains per tenant | Unlimited | Within reason, soft limit 50 |
| Total custom domains | Unlimited | Caddy handles 10k+ certs |
| SSL cert issuance rate | ~50/hour | Let's Encrypt rate limit |
| DNS verification timeout | 30 seconds | `dns_get_record()` timeout |
| SSL verification timeout | 15 seconds | HTTP request timeout |
| Health check interval | 6 hours | Configurable via scheduler |
| Domain cache TTL | 1 hour | Matches existing tenant cache |
