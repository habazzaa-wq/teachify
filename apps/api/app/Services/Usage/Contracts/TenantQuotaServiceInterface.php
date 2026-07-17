<?php

namespace App\Services\Usage\Contracts;

interface TenantQuotaServiceInterface
{
    public function canUpload(int $tenantId): bool;
    public function canCreateVideo(int $tenantId): bool;
    public function canCreateFolder(int $tenantId): bool;
    public function canCreateCollection(int $tenantId): bool;
    public function canUseBandwidth(int $tenantId): bool;
    public function canUseStreaming(int $tenantId): bool;
    public function remainingStorage(int $tenantId): int;
    public function remainingBandwidth(int $tenantId): int;
    public function remainingViews(int $tenantId): int;
    public function remainingUploads(int $tenantId): int;
    public function remainingFolders(int $tenantId): int;
    public function remainingCollections(int $tenantId): int;
    public function remainingRequests(int $tenantId): int;
    public function remainingPercentage(int $tenantId, string $field): float;
}
