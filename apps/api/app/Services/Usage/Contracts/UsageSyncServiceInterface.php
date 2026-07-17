<?php

namespace App\Services\Usage\Contracts;

interface UsageSyncServiceInterface
{
    public function syncTenant(int $tenantId): void;
    public function syncAllTenants(): void;
    public function incrementalSync(): void;
    public function fullSync(): void;
    public function queueSync(int $tenantId): void;
    public function retryFailedSync(int $tenantId): void;
}
