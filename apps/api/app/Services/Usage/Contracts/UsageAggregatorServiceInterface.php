<?php

namespace App\Services\Usage\Contracts;

interface UsageAggregatorServiceInterface
{
    public function currentUsage(int $tenantId): array;
    public function dailyUsage(int $tenantId, string $date): array;
    public function weeklyUsage(int $tenantId, string $date): array;
    public function monthlyUsage(int $tenantId, int $year, int $month): array;
    public function yearlyUsage(int $tenantId, int $year): array;
    public function lifetimeUsage(int $tenantId): array;
}
