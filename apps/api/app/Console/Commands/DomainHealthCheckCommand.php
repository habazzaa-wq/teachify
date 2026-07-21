<?php

namespace App\Console\Commands;

use App\Jobs\Domain\HealthCheckDomainsJob;
use App\Models\TenantDomain;
use Illuminate\Console\Command;

class DomainHealthCheckCommand extends Command
{
    protected $signature = 'domain:health-check
        {--domain= : Specific domain to check}';

    protected $description = 'Run health check on custom domains';

    public function handle(): int
    {
        $specificDomain = $this->option('domain');

        if ($specificDomain) {
            $domain = TenantDomain::where('domain', $specificDomain)->first();

            if (!$domain) {
                $this->error("Domain {$specificDomain} not found.");
                return self::FAILURE;
            }

            $this->info("Checking health for {$domain->domain}...");
            HealthCheckDomainsJob::dispatchSync();
            $this->info("Done.");
            return self::SUCCESS;
        }

        $this->info('Dispatching health check for all active custom domains...');
        HealthCheckDomainsJob::dispatch();
        $this->info('Health check job dispatched.');

        return self::SUCCESS;
    }
}
