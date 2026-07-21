<?php

namespace App\Jobs\Domain;

use App\Models\TenantDomain;
use App\Services\Domain\DomainCacheService;
use App\Services\Domain\VerificationLogService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ActivateDomainJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 30;

    public function __construct(
        public TenantDomain $domain,
    ) {}

    public function handle(
        DomainCacheService $cache,
        VerificationLogService $log,
    ): void {
        $this->domain->refresh();

        if ($this->domain->status === 'active') {
            return;
        }

        if ($this->domain->ssl_status !== 'active') {
            Log::warning('ActivateDomainJob: SSL not active, skipping.', [
                'domain' => $this->domain->domain,
                'ssl_status' => $this->domain->ssl_status,
            ]);
            return;
        }

        $this->domain->update([
            'status' => 'active',
            'verified_at' => now(),
            'verification_token' => null,
        ]);

        $cache->invalidateDomain($this->domain);

        $log->record($this->domain, 'domain_activated', 'success', [
            'message' => 'Domain is now active and serving traffic.',
            'verified_at' => now()->toIso8601String(),
        ]);

        Log::info('Domain activated', [
            'domain' => $this->domain->domain,
            'tenant_id' => $this->domain->tenant_id,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('ActivateDomainJob failed', [
            'domain' => $this->domain->domain,
            'error' => $exception->getMessage(),
        ]);
    }
}
