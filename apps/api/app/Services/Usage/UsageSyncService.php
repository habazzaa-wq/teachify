<?php

namespace App\Services\Usage;

use App\Models\Tenant;
use App\Repositories\Usage\TenantUsageRepository;
use App\Services\Bunny\Contracts\BunnyUsageInterface;
use Illuminate\Support\Facades\Log;

class UsageSyncService
{
    public function __construct(
        private readonly TenantUsageRepository $usageRepo,
        private readonly BunnyUsageInterface $bunnyUsage,
        private readonly UsageCacheService $cache,
        private readonly UsageQueueService $queue,
    ) {
    }

    public function syncTenant(int $tenantId): void
    {
        $start = microtime(true);
        $correlationId = str()->uuid();

        Log::channel('usage')->info('Starting tenant usage sync', [
            'tenant_id' => $tenantId,
            'correlation_id' => $correlationId,
        ]);

        try {
            $tenant = Tenant::find($tenantId);
            if (!$tenant) {
                Log::channel('usage')->warning('Tenant not found for sync', [
                    'tenant_id' => $tenantId,
                    'correlation_id' => $correlationId,
                ]);
                return;
            }

            $usageData = $this->bunnyUsage->getTenantUsage($tenantId);
            $platformUsage = $this->bunnyUsage->getPlatformUsage();
            $streamingUsage = $this->bunnyUsage->getStreamingUsage();
            $bandwidth = $this->bunnyUsage->getBandwidth();
            $views = $this->bunnyUsage->getViews();
            $requests = $this->bunnyUsage->getRequests();

            $this->usageRepo->updateOrCreate($tenantId, [
                'storage_bytes' => $usageData['platform_storage_bytes'] ?? 0,
                'bandwidth_bytes' => $bandwidth['bandwidth_used_bytes'] ?? 0,
                'stream_bandwidth_bytes' => $streamingUsage['bandwidth_used_bytes'] ?? 0,
                'cdn_bandwidth_bytes' => $platformUsage['cdn']['pull_zone_bandwidth_used'] ?? 0,
                'requests' => $requests['requests_served'] ?? 0,
                'views' => $views['requests_served'] ?? 0,
                'last_synced_at' => now(),
            ]);

            $this->cache->invalidateTenant($tenantId);

            $duration = round((microtime(true) - $start) * 1000, 2);

            Log::channel('usage')->info('Tenant usage sync completed', [
                'tenant_id' => $tenantId,
                'correlation_id' => $correlationId,
                'duration_ms' => $duration,
            ]);
        } catch (\Throwable $e) {
            Log::channel('usage')->error('Tenant usage sync failed', [
                'tenant_id' => $tenantId,
                'correlation_id' => $correlationId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function syncAllTenants(): void
    {
        $start = microtime(true);
        $correlationId = str()->uuid();

        Log::channel('usage')->info('Starting all tenants usage sync', [
            'correlation_id' => $correlationId,
        ]);

        $tenants = Tenant::query()->where('status', 'active')->pluck('id');

        foreach ($tenants as $tenantId) {
            try {
                $this->syncTenant($tenantId);
            } catch (\Throwable $e) {
                Log::channel('usage')->error('Sync failed for tenant', [
                    'tenant_id' => $tenantId,
                    'correlation_id' => $correlationId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $duration = round((microtime(true) - $start) * 1000, 2);

        Log::channel('usage')->info('All tenants usage sync completed', [
            'correlation_id' => $correlationId,
            'duration_ms' => $duration,
            'tenant_count' => count($tenants),
        ]);
    }

    public function incrementalSync(): void
    {
        $tenantIds = $this->usageRepo->getTenantsNeedingSync(15);
        foreach ($tenantIds as $tenantId) {
            $this->queueSync((int) $tenantId);
        }
    }

    public function fullSync(): void
    {
        $this->syncAllTenants();
    }

    public function queueSync(int $tenantId): void
    {
        $this->queue->dispatchSyncTenant($tenantId);
    }

    public function retryFailedSync(int $tenantId): void
    {
        $this->queue->dispatchRetry($tenantId);
    }
}