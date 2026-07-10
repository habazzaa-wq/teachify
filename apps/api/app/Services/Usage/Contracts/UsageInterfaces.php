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

interface UsageAggregatorServiceInterface
{
    public function currentUsage(int $tenantId): array;
    public function dailyUsage(int $tenantId, string $date): array;
    public function weeklyUsage(int $tenantId, string $date): array;
    public function monthlyUsage(int $tenantId, int $year, int $month): array;
    public function yearlyUsage(int $tenantId, int $year): array;
    public function lifetimeUsage(int $tenantId): array;
}

interface UsageSyncServiceInterface
{
    public function syncTenant(int $tenantId): void;
    public function syncAllTenants(): void;
    public function incrementalSync(): void;
    public function fullSync(): void;
    public function queueSync(int $tenantId): void;
    public function retryFailedSync(int $tenantId): void;
}

interface UsageCalculatorServiceInterface
{
    public function calculateStorage(int $tenantId): array;
    public function calculateBandwidth(): array;
    public function calculateViews(): array;
    public function calculateRequests(): array;
    public function calculateStreamUsage(): array;
    public function calculateCdnUsage(): array;
    public function calculateAll(int $tenantId): array;
}

interface UsageSnapshotServiceInterface
{
    public function createSnapshot(int $tenantId): array;
    public function getLatestSnapshot(int $tenantId): array;
    public function getSnapshots(int $tenantId): array;
    public function deleteOldSnapshots(int $tenantId, string $before): void;
}

interface UsageThresholdServiceInterface
{
    public function checkThreshold(int $tenantId, string $field): void;
    public function checkAllThresholds(int $tenantId): void;
    public function setConfigurableThresholds(array $thresholds): void;
    public function getThresholds(): array;
}

interface UsageHistoryServiceInterface
{
    public function dailyHistory(int $tenantId, int $limit): array;
    public function weeklyHistory(int $tenantId, int $limit): array;
    public function monthlyHistory(int $tenantId, int $limit): array;
    public function yearlyHistory(int $tenantId, int $limit): array;
    public function periodHistory(int $tenantId, string $period, int $limit): array;
}

interface UsageReportServiceInterface
{
    public function generateDailyReport(int $tenantId): array;
    public function generateWeeklyReport(int $tenantId): array;
    public function generateMonthlyReport(int $tenantId): array;
    public function generateYearlyReport(int $tenantId): array;
    public function generatePlatformReport(): array;
}
