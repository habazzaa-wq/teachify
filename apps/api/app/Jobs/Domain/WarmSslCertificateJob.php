<?php

namespace App\Jobs\Domain;

use App\Models\TenantDomain;
use App\Services\Domain\SslCertificateService;
use App\Services\Domain\VerificationLogService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class WarmSslCertificateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;
    public int $timeout = 30;
    public int $backoff = 120;

    public function __construct(
        public TenantDomain $domain,
    ) {}

    public function handle(
        SslCertificateService $ssl,
        VerificationLogService $log,
    ): void {
        $this->domain->refresh();

        if ($this->domain->status !== 'dns_verified') {
            return;
        }

        if ($this->domain->ssl_status === 'active') {
            return;
        }

        $this->domain->update(['ssl_status' => 'pending']);

        $log->record($this->domain, 'ssl_requested', 'pending', [
            'message' => 'SSL certificate requested via Caddy on-demand TLS.',
        ]);

        $warmed = $ssl->warmCertificate($this->domain->domain);

        if (!$warmed) {
            $log->record($this->domain, 'ssl_warmup', 'failed', [
                'error' => 'Certificate warm-up request failed. Will retry.',
            ]);
            return;
        }

        $probe = $ssl->probeSsl($this->domain->domain);

        if ($probe['valid']) {
            $this->domain->update([
                'ssl_status' => 'active',
                'ssl_provider' => $probe['provider'],
                'ssl_issued_at' => $probe['issued_at'] ?? now(),
                'ssl_expires_at' => $probe['expires_at'],
                'ssl_last_error' => null,
                'ssl_last_check' => now(),
                'ssl_renewal_attempts' => 0,
            ]);

            $log->record($this->domain, 'ssl_issued', 'success', [
                'provider' => $probe['provider'],
                'issued_at' => $probe['issued_at'],
                'expires_at' => $probe['expires_at'],
            ]);

            ActivateDomainJob::dispatch($this->domain);
        } else {
            $this->domain->update([
                'ssl_status' => 'error',
                'ssl_last_error' => $probe['error'] ?? 'Certificate not yet available.',
                'ssl_last_check' => now(),
                'ssl_renewal_attempts' => $this->domain->ssl_renewal_attempts + 1,
            ]);

            $log->record($this->domain, 'ssl_issued', 'failed', [
                'error' => $probe['error'] ?? 'Unknown error',
                'attempt' => $this->domain->ssl_renewal_attempts,
            ]);

            $this->fail(new \RuntimeException($probe['error'] ?? 'SSL issuance failed'));
        }
    }

    public function backoff(): array
    {
        return [120, 240, 480, 960, 1920];
    }

    public function failed(\Throwable $exception): void
    {
        $this->domain->update([
            'ssl_status' => 'error',
            'ssl_last_error' => $exception->getMessage(),
            'ssl_last_check' => now(),
        ]);

        Log::error('WarmSslCertificateJob failed', [
            'domain' => $this->domain->domain,
            'error' => $exception->getMessage(),
        ]);
    }
}
