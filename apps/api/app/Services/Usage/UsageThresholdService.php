<?php

namespace App\Services\Usage;

use App\Repositories\Usage\TenantUsageRepository;
use App\Services\Usage\Events\StorageWarning;
use App\Services\Usage\Events\BandwidthWarning;
use App\Services\Usage\Events\ViewsWarning;
use App\Services\Usage\Events\StorageLimitReached;
use App\Services\Usage\Events\BandwidthLimitReached;
use App\Services\Usage\Events\ViewsLimitReached;
use App\Services\Usage\Events\QuotaRecovered;
use Illuminate\Support\Facades\Log;

class UsageThresholdService
{
    private array $thresholds = [50, 70, 80, 90, 95, 100];

    public function __construct(
        private readonly TenantUsageRepository $usageRepo,
        private readonly SubscriptionLimitService $limits,
    ) {
    }

    public function checkThreshold(int $tenantId, string $field): void
    {
        $usage = $this->usageRepo->getByTenantId($tenantId);
        if (!$usage) {
            return;
        }

        $limit = $this->getLimitForField($tenantId, $field);
        $used = $this->getUsedForField($usage, $field);

        if ($limit <= 0) {
            return;
        }

        $percentage = round(($used / $limit) * 100, 2);

        foreach ($this->thresholds as $threshold) {
            if ($percentage >= $threshold) {
                $previous = $this->lastKnownThreshold($tenantId, $field);
                if ($previous !== $threshold) {
                    $this->dispatchEvent($tenantId, $field, $used, $limit, $percentage, $threshold);
                    $this->recordThreshold($tenantId, $field, $threshold);
                }
            }
        }

        if ($percentage < min($this->thresholds)) {
            $previous = $this->lastKnownThreshold($tenantId, $field);
            if ($previous !== null) {
                QuotaRecovered::dispatch($tenantId, $field, $used, $limit, $percentage);
                $this->clearThreshold($tenantId, $field);

                Log::channel('usage')->info('Quota recovered', [
                    'tenant_id' => $tenantId,
                    'field' => $field,
                    'percentage' => $percentage,
                ]);
            }
        }
    }

    public function checkAllThresholds(int $tenantId): void
    {
        $this->checkThreshold($tenantId, 'storage');
        $this->checkThreshold($tenantId, 'bandwidth');
        $this->checkThreshold($tenantId, 'views');
    }

    public function setConfigurableThresholds(array $thresholds): void
    {
        $this->thresholds = array_unique(array_map('intval', $thresholds));
        sort($this->thresholds);
    }

    public function getThresholds(): array
    {
        return $this->thresholds;
    }

    private function dispatchEvent(int $tenantId, string $field, int $used, int $limit, float $percentage, int $threshold): void
    {
        if ($threshold === 100) {
            match ($field) {
                'storage' => StorageLimitReached::dispatch($tenantId, $used, $limit),
                'bandwidth' => BandwidthLimitReached::dispatch($tenantId, $used, $limit),
                'views' => ViewsLimitReached::dispatch($tenantId, $used, $limit),
                default => null,
            };
        } else {
            match ($field) {
                'storage' => StorageWarning::dispatch($tenantId, $used, (int) round($limit * $threshold / 100), $percentage),
                'bandwidth' => BandwidthWarning::dispatch($tenantId, $used, (int) round($limit * $threshold / 100), $percentage),
                'views' => ViewsWarning::dispatch($tenantId, $used, (int) round($limit * $threshold / 100), $percentage),
                default => null,
            };
        }

        Log::channel('usage')->info('Threshold event dispatched', [
            'tenant_id' => $tenantId,
            'field' => $field,
            'percentage' => $percentage,
            'threshold' => $threshold,
            'used' => $used,
            'limit' => $limit,
        ]);
    }

    private function getLimitForField(int $tenantId, string $field): int
    {
        return match ($field) {
            'storage' => $this->limits->getStorageLimit($tenantId),
            'bandwidth' => $this->limits->getBandwidthLimit($tenantId),
            'views' => $this->limits->getViewsLimit($tenantId),
            default => 0,
        };
    }

    private function getUsedForField($usage, string $field): int
    {
        return match ($field) {
            'storage' => $usage->storage_bytes ?? 0,
            'bandwidth' => $usage->bandwidth_bytes ?? 0,
            'views' => $usage->views ?? 0,
            default => 0,
        };
    }

    private function lastKnownThreshold(int $tenantId, string $field): ?int
    {
        $key = "usage:threshold:{$tenantId}:{$field}";
        return cache()->get($key);
    }

    private function recordThreshold(int $tenantId, string $field, int $threshold): void
    {
        $key = "usage:threshold:{$tenantId}:{$field}";
        cache()->put($key, $threshold, now()->addDays(30));
    }

    private function clearThreshold(int $tenantId, string $field): void
    {
        $key = "usage:threshold:{$tenantId}:{$field}";
        cache()->forget($key);
    }
}