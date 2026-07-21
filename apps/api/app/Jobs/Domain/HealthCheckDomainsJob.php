<?php

namespace App\Jobs\Domain;

use App\Models\TenantDomain;
use App\Services\Domain\DomainHealthService;
use App\Services\Domain\VerificationLogService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class HealthCheckDomainsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 300;

    public function handle(
        DomainHealthService $health,
        VerificationLogService $log,
    ): void {
        $activeDomains = TenantDomain::query()
            ->where('status', 'active')
            ->where('type', 'custom_domain')
            ->get();

        if ($activeDomains->isEmpty()) {
            return;
        }

        Log::info("HealthCheckDomainsJob: checking {$activeDomains->count()} active domain(s).");

        foreach ($activeDomains as $domain) {
            $result = $health->check($domain);

            $log->record($domain, 'health_check', $result['score'] >= 50 ? 'success' : 'failed', [
                'score' => $result['score'],
                'dns' => $result['dns'],
                'ssl' => $result['ssl'],
                'http' => $result['http'],
                'latency' => $result['latency'],
            ]);

            if ($result['score'] === 0) {
                Log::warning("HealthCheckDomainsJob: domain {$domain->domain} is completely unhealthy.");
            }
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('HealthCheckDomainsJob failed', [
            'error' => $exception->getMessage(),
        ]);
    }
}
