<?php

namespace App\Services\Usage\Contracts;

interface UsageHistoryServiceInterface
{
    public function dailyHistory(int $tenantId, int $limit): array;
    public function weeklyHistory(int $tenantId, int $limit): array;
    public function monthlyHistory(int $tenantId, int $limit): array;
    public function yearlyHistory(int $tenantId, int $limit): array;
    public function periodHistory(int $tenantId, string $period, int $limit): array;
}
