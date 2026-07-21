<?php

namespace App\Jobs\Domain;

use App\Models\TenantDomain;
use App\Services\Domain\DnsVerificationService;
use App\Services\Domain\VerificationLogService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CheckPendingDomainsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 120;

    public function handle(
        DnsVerificationService $dns,
        VerificationLogService $log,
    ): void {
        $lock = Cache::lock('domain-check-pending', 60);

        if (!$lock->get()) {
            Log::info('CheckPendingDomainsJob: skipped, another instance running.');
            return;
        }

        try {
            $pendingDomains = TenantDomain::pendingCustom()
                ->with('tenant')
                ->get();

            if ($pendingDomains->isEmpty()) {
                return;
            }

            Log::info("CheckPendingDomainsJob: checking {$pendingDomains->count()} pending domain(s).");

            foreach ($pendingDomains as $domain) {
                $this->processDomain($domain, $dns, $log);
            }
        } finally {
            $lock->release();
        }
    }

    private function processDomain(
        TenantDomain $domain,
        DnsVerificationService $dns,
        VerificationLogService $log,
    ): void {
        if ($domain->status !== 'pending') {
            return;
        }

        if ($domain->tenant && $domain->tenant->status !== 'active') {
            $log->record($domain, 'dns_checked', 'skipped', [
                'message' => 'Tenant is not active.',
            ]);
            return;
        }

        $result = $dns->verify($domain);

        $domain->update([
            'last_dns_check' => now(),
            'dns_checked_at' => now(),
            'verification_method' => $result['type'],
        ]);

        if ($result['passed']) {
            $domain->update([
                'status' => 'dns_verified',
                'verification_errors' => null,
                'expected_ip' => config('services.platform.server_ip'),
            ]);

            $log->record($domain, 'dns_checked', 'success', [
                'type' => $result['type'],
                'records' => $result['records'],
            ]);

            $log->record($domain, 'dns_verified', 'success', [
                'message' => "DNS {$result['type']} record verified.",
            ]);

            WarmSslCertificateJob::dispatch($domain);
        } else {
            $attempts = ($domain->verification_errors ? 1 : 0);
            $errors = json_decode($domain->verification_errors ?? '[]', true) ?? [];
            $errors[] = [
                'at' => now()->toIso8601String(),
                'error' => $result['error'],
            ];

            $domain->update([
                'verification_errors' => json_encode($errors),
            ]);

            $log->record($domain, 'dns_checked', 'failed', [
                'error' => $result['error'],
            ]);

            if (count($errors) >= 50) {
                $domain->update(['status' => 'failed']);
                $log->record($domain, 'dns_failed', 'failed', [
                    'message' => 'DNS verification failed after 50 attempts.',
                ]);
            }
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('CheckPendingDomainsJob failed', [
            'error' => $exception->getMessage(),
        ]);
    }
}
