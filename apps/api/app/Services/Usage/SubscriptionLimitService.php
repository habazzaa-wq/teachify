<?php

namespace App\Services\Usage;

use App\Models\Tenant;

class SubscriptionLimitService
{
    public function getStorageLimit(int $tenantId): int
    {
        return $this->getLimit($tenantId, 'storage');
    }

    public function getBandwidthLimit(int $tenantId): int
    {
        return $this->getLimit($tenantId, 'bandwidth');
    }

    public function getViewsLimit(int $tenantId): int
    {
        return $this->getLimit($tenantId, 'views');
    }

    public function getVideoCountLimit(int $tenantId): int
    {
        return $this->getLimit($tenantId, 'videos');
    }

    public function getUploadLimit(int $tenantId): int
    {
        return $this->getLimit($tenantId, 'uploads');
    }

    public function getRequestLimit(int $tenantId): int
    {
        return $this->getLimit($tenantId, 'requests');
    }

    public function getFolderLimit(int $tenantId): int
    {
        return $this->getLimit($tenantId, 'folders');
    }

    public function getCollectionLimit(int $tenantId): int
    {
        return $this->getLimit($tenantId, 'collections');
    }

    public function getLimit(int $tenantId, string $key): int
    {
        $plan = $this->getPlan($tenantId);
        $limits = $plan['limits'] ?? [];
        return (int) ($limits[$key] ?? $this->defaultLimit($key));
    }

    public function getAllLimits(int $tenantId): array
    {
        return [
            'storage' => $this->getStorageLimit($tenantId),
            'bandwidth' => $this->getBandwidthLimit($tenantId),
            'views' => $this->getViewsLimit($tenantId),
            'videos' => $this->getVideoCountLimit($tenantId),
            'uploads' => $this->getUploadLimit($tenantId),
            'requests' => $this->getRequestLimit($tenantId),
            'folders' => $this->getFolderLimit($tenantId),
            'collections' => $this->getCollectionLimit($tenantId),
        ];
    }

    private function getPlan(int $tenantId): array
    {
        static $plans = [];
        if (!isset($plans[$tenantId])) {
            $tenant = Tenant::find($tenantId);
            $plans[$tenantId] = $tenant ? ($tenant->plan ?: $tenant->getAttribute('plan') ?? []) : [];
        }
        return $plans[$tenantId];
    }

    private function defaultLimit(string $key): int
    {
        $defaults = [
            'storage' => 1073741824,
            'bandwidth' => 1073741824,
            'views' => 10000,
            'videos' => 100,
            'uploads' => 1000,
            'requests' => 100000,
            'folders' => 500,
            'collections' => 50,
        ];
        return $defaults[$key] ?? 0;
    }
}