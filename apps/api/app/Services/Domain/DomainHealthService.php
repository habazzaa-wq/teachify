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

        $dns = app(DnsVerificationService::class);
        $results['dns'] = $dns->isDnsReady($domain->domain);

        $start = microtime(true);
        try {
            $response = Http::timeout(10)
                ->withOptions(['verify' => false])
                ->get("https://{$domain->domain}/api/diag/ping");

            $results['http'] = $response->successful();
            $results['ssl'] = $response->successful();
            $results['latency'] = round((microtime(true) - $start) * 1000);
        } catch (\Throwable $e) {
            Log::warning("Health check failed for {$domain->domain}: {$e->getMessage()}");
        }

        $score = 0;
        if ($results['dns']) {
            $score += 33;
        }
        if ($results['ssl']) {
            $score += 33;
        }
        if ($results['http']) {
            $score += 34;
        }
        $results['score'] = $score;

        $domain->update([
            'last_health_check_at' => now(),
            'health_score' => $score,
        ]);

        return $results;
    }
}
