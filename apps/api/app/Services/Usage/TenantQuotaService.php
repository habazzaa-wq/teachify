<?php

namespace App\Services\Usage;

use App\Repositories\Usage\TenantUsageRepository;

class TenantQuotaService
{
    public function __construct(
        private readonly TenantUsageRepository $usageRepo,
        private readonly SubscriptionLimitService $limits,
        private readonly UsageCacheService $cache,
    ) {
    }

    public function canUpload(int $tenantId): bool
    {
        return $this->remainingUploads($tenantId) > 0;
    }

    public function canCreateVideo(int $tenantId): bool
    {
        $usage = $this->getUsage($tenantId);
        $limit = $this->limits->getVideoCountLimit($tenantId);
        return $usage['uploaded_videos'] < $limit;
    }

    public function canCreateFolder(int $tenantId): bool
    {
        return $this->remainingFolders($tenantId) > 0;
    }

    public function canCreateCollection(int $tenantId): bool
    {
        return $this->remainingCollections($tenantId) > 0;
    }

    public function canUseBandwidth(int $tenantId): bool
    {
        return $this->remainingBandwidth($tenantId) > 0;
    }

    public function canUseStreaming(int $tenantId): bool
    {
        return $this->remainingBandwidth($tenantId) > 0;
    }

    public function remainingStorage(int $tenantId): int
    {
        $usage = $this->getUsage($tenantId);
        return max(0, $this->limits->getStorageLimit($tenantId) - $usage['storage_bytes']);
    }

    public function remainingBandwidth(int $tenantId): int
    {
        $usage = $this->getUsage($tenantId);
        return max(0, $this->limits->getBandwidthLimit($tenantId) - $usage['bandwidth_bytes']);
    }

    public function remainingViews(int $tenantId): int
    {
        $usage = $this->getUsage($tenantId);
        return max(0, $this->limits->getViewsLimit($tenantId) - $usage['views']);
    }

    public function remainingUploads(int $tenantId): int
    {
        $usage = $this->getUsage($tenantId);
        return max(0, $this->limits->getUploadLimit($tenantId) - $usage['uploaded_files']);
    }

    public function remainingFolders(int $tenantId): int
    {
        $usage = $this->getUsage($tenantId);
        return max(0, $this->limits->getFolderLimit($tenantId) - ($usage['folders'] ?? 0));
    }

    public function remainingCollections(int $tenantId): int
    {
        $usage = $this->getUsage($tenantId);
        return max(0, $this->limits->getCollectionLimit($tenantId) - ($usage['collections'] ?? 0));
    }

    public function remainingRequests(int $tenantId): int
    {
        $usage = $this->getUsage($tenantId);
        return max(0, $this->limits->getRequestLimit($tenantId) - $usage['requests']);
    }

    public function remainingPercentage(int $tenantId, string $field): float
    {
        $usage = $this->getUsage($tenantId);
        $limit = $this->limits->getAllLimits($tenantId);

        $fieldToLimit = [
            'storage' => $limit['storage'],
            'bandwidth' => $limit['bandwidth'],
            'views' => $limit['views'],
        ];

        $limitValue = $fieldToLimit[$field] ?? 0;
        $usedValue = $usage[$field . '_bytes'] ?? $usage[$field] ?? 0;

        return $this->calcPercentage($limitValue, $usedValue);
    }

    private function getUsage(int $tenantId): array
    {
        return $this->cache->cacheCurrentUsage($tenantId, function () use ($tenantId) {
            $usage = $this->usageRepo->getByTenantId($tenantId);
            return $usage ? $usage->toArray() : [];
        });
    }

    private function calcPercentage(int $limit, int $used): float
    {
        if ($limit <= 0) {
            return 0;
        }
        return round(($used / $limit) * 100, 2);
    }
}
