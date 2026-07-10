<?php

namespace App\Services\UploadGuard;

use App\Models\Tenant;
use App\Services\UploadGuard\Events\BandwidthExceeded;
use App\Services\UploadGuard\Events\QuotaExceeded;
use App\Services\UploadGuard\Events\StorageExceeded;
use App\Services\UploadGuard\Events\UploadRejected;
use App\Services\UploadGuard\Exceptions\BandwidthExceededException;
use App\Services\UploadGuard\Exceptions\StorageExceededException;
use App\Services\Usage\SubscriptionLimitService;
use App\Services\Usage\TenantQuotaService;

class UploadGuardService
{
    public function __construct(
        private readonly UploadPolicyService $policy,
        private readonly UploadValidationService $validation,
        private readonly TenantQuotaService $quota,
        private readonly SubscriptionLimitService $limits,
    ) {
    }

    public function guardUpload(Tenant $tenant, string $uploadType, ?int $sizeBytes = null, ?string $mime = null): array
    {
        $this->policy->ensureTenantCanUpload($tenant);

        $result = $this->validation->validateUpload($tenant, $uploadType, $sizeBytes);

        if (! $result['allowed']) {
            $this->dispatchRejectionEvents($tenant, $uploadType, $result['violations']);
            $this->throwFirstException($result['violations']);
        }

        return $result;
    }

    public function guardFileUpload(Tenant $tenant, ?int $sizeBytes = null, ?string $mime = null): array
    {
        return $this->guardUpload($tenant, 'file', $sizeBytes, $mime);
    }

    public function guardVideoUpload(Tenant $tenant, ?int $sizeBytes = null, ?string $mime = null): array
    {
        $this->policy->ensureTenantCanUpload($tenant);

        $result = $this->validation->validateVideoCreation($tenant);

        if (! $result['allowed']) {
            $this->dispatchRejectionEvents($tenant, 'video', $result['violations']);
            $this->throwFirstException($result['violations']);
        }

        return $result;
    }

    public function guardFolderCreation(Tenant $tenant): array
    {
        $this->policy->ensureTenantCanUpload($tenant);

        $result = $this->validation->validateFolderCreation($tenant);

        if (! $result['allowed']) {
            $this->dispatchRejectionEvents($tenant, 'folder', $result['violations']);
            $this->throwFirstException($result['violations']);
        }

        return $result;
    }

    public function guardCollectionCreation(Tenant $tenant): array
    {
        $this->policy->ensureTenantCanUpload($tenant);

        $result = $this->validation->validateCollectionCreation($tenant);

        if (! $result['allowed']) {
            $this->dispatchRejectionEvents($tenant, 'collection', $result['violations']);
            $this->throwFirstException($result['violations']);
        }

        return $result;
    }

    public function canUpload(Tenant $tenant, string $uploadType = 'file'): bool
    {
        try {
            $this->guardUpload($tenant, $uploadType);
            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    public function getQuotaStatus(Tenant $tenant): array
    {
        $tenantId = $tenant->id;

        return [
            'storage' => $this->validation->buildStorageDetail($tenant),
            'bandwidth' => $this->buildBandwidthDetail($tenantId),
            'uploads' => $this->buildUploadCountDetail($tenantId),
            'videos' => $this->buildVideoCountDetail($tenantId),
            'subscription' => $this->policy->getSubscriptionDetails($tenant),
        ];
    }

    public function checkBunnyAvailability(Tenant $tenant): bool
    {
        $integration = \App\Models\TenantIntegration::query()
            ->where('tenant_id', $tenant->id)
            ->where('provider', 'bunny')
            ->whereIn('service', ['storage', 'stream'])
            ->where('status', 'active')
            ->exists();

        return $integration;
    }

    private function dispatchRejectionEvents(Tenant $tenant, string $uploadType, array $violations): void
    {
        foreach ($violations as $violation) {
            $type = $violation['type'];

            match ($type) {
                'storage' => StorageExceeded::dispatch(
                    $tenant->id,
                    $violation['used'] ?? 0,
                    $violation['limit'] ?? 0,
                    $violation['percentage'] ?? 0,
                    $uploadType,
                ),
                'bandwidth' => BandwidthExceeded::dispatch(
                    $tenant->id,
                    $violation['used'] ?? 0,
                    $violation['limit'] ?? 0,
                    $violation['percentage'] ?? 0,
                    $uploadType,
                ),
                default => QuotaExceeded::dispatch(
                    $tenant->id,
                    $type,
                    0,
                    $violation['limit'] ?? 0,
                    0,
                    $uploadType,
                ),
            };

            UploadRejected::dispatch($tenant->id, $type, $uploadType, $violation);
        }
    }

    private function throwFirstException(array $violations): never
    {
        $first = $violations[0];
        $type = $first['type'];

        match ($type) {
            'storage' => throw new StorageExceededException(
                $first['used'] ?? 0,
                $first['limit'] ?? 0,
                $first['remaining'] ?? 0,
                $first['percentage'] ?? 0,
            ),
            'bandwidth' => throw new BandwidthExceededException(
                $first['used'] ?? 0,
                $first['limit'] ?? 0,
                $first['remaining'] ?? 0,
                $first['percentage'] ?? 0,
            ),
            default => throw new \RuntimeException(
                $first['reason'] ?? 'Upload quota exceeded.',
                403,
            ),
        };
    }

    private function buildBandwidthDetail(int $tenantId): array
    {
        $remaining = $this->quota->remainingBandwidth($tenantId);
        $limit = $this->limits->getBandwidthLimit($tenantId);
        $used = $limit - $remaining;
        $percentage = $limit > 0 ? round(($used / $limit) * 100, 2) : 0;

        return [
            'used' => $used,
            'limit' => $limit,
            'remaining' => $remaining,
            'percentage' => $percentage,
            'human_used' => $this->formatBytes($used),
            'human_limit' => $this->formatBytes($limit),
            'human_remaining' => $this->formatBytes($remaining),
        ];
    }

    private function buildUploadCountDetail(int $tenantId): array
    {
        $remaining = $this->quota->remainingUploads($tenantId);
        $limit = $this->limits->getUploadLimit($tenantId);
        $used = $limit - $remaining;
        $percentage = $limit > 0 ? round(($used / $limit) * 100, 2) : 0;

        return [
            'used' => $used,
            'limit' => $limit,
            'remaining' => $remaining,
            'percentage' => $percentage,
        ];
    }

    private function buildVideoCountDetail(int $tenantId): array
    {
        $limit = $this->limits->getVideoCountLimit($tenantId);

        return [
            'limit' => $limit,
        ];
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = $bytes > 0 ? floor(log($bytes, 1024)) : 0;
        $power = min($power, count($units) - 1);
        $value = $bytes / (1024 ** $power);

        return round($value, 1) . ' ' . $units[(int) $power];
    }
}
