<?php

namespace App\Services\Usage\Contracts;

interface UsageReportServiceInterface
{
    public function generateDailyReport(int $tenantId): array;
    public function generateWeeklyReport(int $tenantId): array;
    public function generateMonthlyReport(int $tenantId): array;
    public function generateYearlyReport(int $tenantId): array;
    public function generatePlatformReport(): array;
}
