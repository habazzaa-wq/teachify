<?php

namespace App\Services\Usage\Contracts;

interface TenantUsageServiceInterface
{
    public function getUsage(int $tenantId): array;

    public function getUsageHistory(int $tenantId, string $period, int $limit = 30): array;

    public function getUsageSnapshot(int $tenantId, ?string $since = null): array;

    public function getQuota(int $tenantId): array;

    public function getRemainingLimits(int $tenantId): array;

    public function getSyncStatus(int $tenantId): array;

    public function syncUsage(int $tenantId): void;

    public function syncAllTenantsUsage(): void;
}
