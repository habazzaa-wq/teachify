<?php

namespace App\Services\Bunny\Contracts;

interface BunnyUsageInterface
{
    public function getCurrentStorage(): array;

    public function getBandwidth(): array;

    public function getViews(): array;

    public function getRequests(): array;

    public function getCdnUsage(): array;

    public function getStorageUsage(): array;

    public function getStreamingUsage(): array;

    public function getDailyUsage(?string $dateFrom = null, ?string $dateTo = null): array;

    public function getMonthlyUsage(?int $year = null, ?int $month = null): array;

    public function getTenantUsage(int $tenantId): array;

    public function getPlatformUsage(): array;
}
