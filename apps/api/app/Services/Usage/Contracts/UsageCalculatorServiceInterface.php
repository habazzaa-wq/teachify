<?php

namespace App\Services\Usage\Contracts;

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
