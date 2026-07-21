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

class CheckSslExpirationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 120;

    public function handle(
        SslCertificateService $ssl,
        VerificationLogService $log,
    ): void {
        $expiringDomains = TenantDomain::query()
            ->where('status', 'active')
            ->where('type', 'custom_domain')
            ->where('ssl_status', 'active')
            ->where('ssl_expires_at', '<=', now()->addDays(30))
            ->where('ssl_expires_at', '>', now())
            ->get();

        foreach ($expiringDomains as $domain) {
            $probe = $ssl->probeSsl($domain->domain);

            if ($probe['valid']) {
                $domain->update([
                    'ssl_expires_at' => $probe['expires_at'],
                    'ssl_issued_at' => $probe['issued_at'] ?? $domain->ssl_issued_at,
                    'ssl_last_check' => now(),
                ]);

                $log->record($domain, 'ssl_expiration_check', 'success', [
                    'expires_at' => $probe['expires_at'],
                    'days_remaining' => $probe['expires_at']
                        ? (new \DateTime($probe['expires_at']))->diff(new \DateTime())->days
                        : null,
                ]);
            } else {
                $domain->update([
                    'ssl_last_error' => $probe['error'],
                    'ssl_last_check' => now(),
                ]);

                $log->record($domain, 'ssl_expiration_check', 'failed', [
                    'error' => $probe['error'],
                ]);
            }
        }

        $expiredDomains = TenantDomain::query()
            ->where('status', 'active')
            ->where('ssl_status', 'active')
            ->where('ssl_expires_at', '<', now())
            ->get();

        foreach ($expiredDomains as $domain) {
            $domain->update(['ssl_status' => 'expired']);

            $log->record($domain, 'ssl_expired', 'failed', [
                'message' => 'Certificate has expired.',
                'expired_at' => $domain->ssl_expires_at?->toIso8601String(),
            ]);

            WarmSslCertificateJob::dispatch($domain);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('CheckSslExpirationJob failed', [
            'error' => $exception->getMessage(),
        ]);
    }
}
