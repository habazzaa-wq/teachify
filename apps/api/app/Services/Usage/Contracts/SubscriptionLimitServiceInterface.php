<?php

namespace App\Services\Usage\Contracts;

interface SubscriptionLimitServiceInterface
{
    public function getStorageLimit(int $tenantId): int;
    public function getBandwidthLimit(int $tenantId): int;
    public function getViewsLimit(int $tenantId): int;
    public function getVideoCountLimit(int $tenantId): int;
    public function getUploadLimit(int $tenantId): int;
    public function getRequestLimit(int $tenantId): int;
    public function getFolderLimit(int $tenantId): int;
    public function getCollectionLimit(int $tenantId): int;
    public function getLimit(int $tenantId, string $key): int;
    public function getAllLimits(int $tenantId): array;
}
