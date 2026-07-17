<?php

namespace App\Services\Usage\Contracts;

interface UsageSnapshotServiceInterface
{
    public function createSnapshot(int $tenantId): array;
    public function getLatestSnapshot(int $tenantId): array;
    public function getSnapshots(int $tenantId): array;
    public function deleteOldSnapshots(int $tenantId, string $before): void;
}
