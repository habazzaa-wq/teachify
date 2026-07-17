<?php

namespace App\Services\Usage\Contracts;

interface UsageThresholdServiceInterface
{
    public function checkThreshold(int $tenantId, string $field): void;
    public function checkAllThresholds(int $tenantId): void;
    public function setConfigurableThresholds(array $thresholds): void;
    public function getThresholds(): array;
}
