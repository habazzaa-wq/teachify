<?php

namespace App\Services\UploadGuard;

use App\Models\Tenant;
use App\Services\Usage\SubscriptionLimitService;
use App\Services\Usage\TenantQuotaService;
use Illuminate\Support\Facades\Log;

class UploadValidationService
{
    public function __construct(
        private readonly TenantQuotaService $quota,
        private readonly SubscriptionLimitService $limits,
    ) {
    }

    public function validateUpload(Tenant $tenant, string $uploadType, ?int $sizeBytes = null): array
    {
        $tenantId = $tenant->id;
        $violations = [];

        $storageCheck = $this->checkStorage($tenantId, $sizeBytes, $uploadType);
        if ($storageCheck !== null) {
            $violations[] = $storageCheck;
        }

        $bandwidthCheck = $this->checkBandwidth($tenantId, $sizeBytes, $uploadType);
        if ($bandwidthCheck !== null) {
            $violations[] = $bandwidthCheck;
        }

        $uploadCountCheck = $this->checkUploadCount($tenantId, $uploadType);
        if ($uploadCountCheck !== null) {
            $violations[] = $uploadCountCheck;
        }

        if ($uploadType === 'video') {
            $videoCountCheck = $this->checkVideoCount($tenantId, $uploadType);
            if ($videoCountCheck !== null) {
                $violations[] = $videoCountCheck;
            }
        }

        if ($uploadType === 'folder') {
            $folderCheck = $this->checkFolderCount($tenantId, $uploadType);
            if ($folderCheck !== null) {
                $violations[] = $folderCheck;
            }
        }

        if ($uploadType === 'collection') {
            $collectionCheck = $this->checkCollectionCount($tenantId, $uploadType);
            if ($collectionCheck !== null) {
                $violations[] = $collectionCheck;
            }
        }

        $usage = $this->quota->remainingStorage($tenantId);
        $bandwidthRemaining = $this->quota->remainingBandwidth($tenantId);
        $storageLimit = $this->limits->getStorageLimit($tenantId);
        $bandwidthLimit = $this->limits->getBandwidthLimit($tenantId);

        return [
            'allowed' => empty($violations),
            'violations' => $violations,
            'quotas' => [
                'storage' => $this->buildQuotaDetail(
                    $storageLimit - $usage,
                    $storageLimit,
                    $usage,
                ),
                'bandwidth' => $this->buildQuotaDetail(
                    $bandwidthLimit - $bandwidthRemaining,
                    $bandwidthLimit,
                    $bandwidthRemaining,
                ),
                'uploads' => $this->buildQuotaDetail(
                    $this->limits->getUploadLimit($tenantId) - $this->quota->remainingUploads($tenantId),
                    $this->limits->getUploadLimit($tenantId),
                    $this->quota->remainingUploads($tenantId),
                ),
            ],
            'warnings' => $this->collectWarnings($tenantId),
        ];
    }

    public function validateFolderCreation(Tenant $tenant): array
    {
        return $this->validateUpload($tenant, 'folder');
    }

    public function validateCollectionCreation(Tenant $tenant): array
    {
        return $this->validateUpload($tenant, 'collection');
    }

    public function validateVideoCreation(Tenant $tenant): array
    {
        return $this->validateUpload($tenant, 'video');
    }

    public function buildStorageDetail(Tenant $tenant): array
    {
        $tenantId = $tenant->id;
        $used = $this->limits->getStorageLimit($tenantId) - $this->quota->remainingStorage($tenantId);
        $limit = $this->limits->getStorageLimit($tenantId);
        $remaining = $this->quota->remainingStorage($tenantId);
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

    private function checkStorage(int $tenantId, ?int $sizeBytes, string $uploadType): ?array
    {
        $remaining = $this->quota->remainingStorage($tenantId);
        $limit = $this->limits->getStorageLimit($tenantId);
        $used = $limit - $remaining;
        $percentage = $limit > 0 ? round(($used / $limit) * 100, 2) : 0;

        if ($remaining <= 0) {
            Log::channel('usage')->warning('Upload blocked: storage full', [
                'tenant_id' => $tenantId,
                'upload_type' => $uploadType,
                'used' => $used,
                'limit' => $limit,
            ]);

            return [
                'type' => 'storage',
                'reason' => 'Storage limit reached',
                'used' => $used,
                'limit' => $limit,
                'remaining' => $remaining,
                'percentage' => $percentage,
                'human_used' => $this->formatBytes($used),
                'human_limit' => $this->formatBytes($limit),
                'human_remaining' => $this->formatBytes($remaining),
            ];
        }

        if ($sizeBytes !== null && $sizeBytes > $remaining) {
            Log::channel('usage')->warning('Upload blocked: insufficient storage', [
                'tenant_id' => $tenantId,
                'upload_type' => $uploadType,
                'requested' => $sizeBytes,
                'remaining' => $remaining,
            ]);

            return [
                'type' => 'storage',
                'reason' => 'Insufficient storage for this file',
                'requested_bytes' => $sizeBytes,
                'used' => $used,
                'limit' => $limit,
                'remaining' => $remaining,
                'percentage' => $percentage,
                'human_used' => $this->formatBytes($used),
                'human_limit' => $this->formatBytes($limit),
                'human_remaining' => $this->formatBytes($remaining),
                'human_requested' => $this->formatBytes($sizeBytes),
            ];
        }

        return null;
    }

    private function checkBandwidth(int $tenantId, ?int $sizeBytes, string $uploadType): ?array
    {
        $remaining = $this->quota->remainingBandwidth($tenantId);
        $limit = $this->limits->getBandwidthLimit($tenantId);
        $used = $limit - $remaining;
        $percentage = $limit > 0 ? round(($used / $limit) * 100, 2) : 0;

        if ($remaining <= 0) {
            Log::channel('usage')->warning('Upload blocked: bandwidth full', [
                'tenant_id' => $tenantId,
                'upload_type' => $uploadType,
                'used' => $used,
                'limit' => $limit,
            ]);

            return [
                'type' => 'bandwidth',
                'reason' => 'Bandwidth limit reached',
                'used' => $used,
                'limit' => $limit,
                'remaining' => $remaining,
                'percentage' => $percentage,
                'human_used' => $this->formatBytes($used),
                'human_limit' => $this->formatBytes($limit),
                'human_remaining' => $this->formatBytes($remaining),
            ];
        }

        return null;
    }

    private function checkUploadCount(int $tenantId, string $uploadType): ?array
    {
        $remaining = $this->quota->remainingUploads($tenantId);
        $limit = $this->limits->getUploadLimit($tenantId);

        if ($remaining <= 0) {
            Log::channel('usage')->warning('Upload blocked: upload count full', [
                'tenant_id' => $tenantId,
                'upload_type' => $uploadType,
                'limit' => $limit,
            ]);

            return [
                'type' => 'upload_count',
                'reason' => 'Upload count limit reached',
                'limit' => $limit,
                'remaining' => $remaining,
            ];
        }

        return null;
    }

    private function checkVideoCount(int $tenantId, string $uploadType): ?array
    {
        if (! $this->quota->canCreateVideo($tenantId)) {
            $limit = $this->limits->getVideoCountLimit($tenantId);

            Log::channel('usage')->warning('Upload blocked: video count full', [
                'tenant_id' => $tenantId,
                'upload_type' => $uploadType,
                'limit' => $limit,
            ]);

            return [
                'type' => 'video_count',
                'reason' => 'Video count limit reached',
                'limit' => $limit,
            ];
        }

        return null;
    }

    private function checkFolderCount(int $tenantId, string $uploadType): ?array
    {
        if (! $this->quota->canCreateFolder($tenantId)) {
            Log::channel('usage')->warning('Upload blocked: folder count full', [
                'tenant_id' => $tenantId,
                'upload_type' => $uploadType,
            ]);

            return [
                'type' => 'folder_count',
                'reason' => 'Folder count limit reached',
            ];
        }

        return null;
    }

    private function checkCollectionCount(int $tenantId, string $uploadType): ?array
    {
        if (! $this->quota->canCreateCollection($tenantId)) {
            Log::channel('usage')->warning('Upload blocked: collection count full', [
                'tenant_id' => $tenantId,
                'upload_type' => $uploadType,
            ]);

            return [
                'type' => 'collection_count',
                'reason' => 'Collection count limit reached',
            ];
        }

        return null;
    }

    private function collectWarnings(int $tenantId): array
    {
        $warnings = [];
        $thresholds = [50, 70, 80, 90, 95];

        foreach (['storage', 'bandwidth'] as $field) {
            $percentage = $this->quota->remainingPercentage($tenantId, $field);

            foreach (array_reverse($thresholds) as $threshold) {
                if ($percentage >= $threshold) {
                    $warnings[] = [
                        'field' => $field,
                        'threshold' => $threshold,
                        'percentage' => $percentage,
                        'message' => "{$field} usage has reached {$percentage}%.",
                    ];
                    break;
                }
            }
        }

        return $warnings;
    }

    private function buildQuotaDetail(int $used, int $limit, int $remaining): array
    {
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

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = $bytes > 0 ? floor(log($bytes, 1024)) : 0;
        $power = min($power, count($units) - 1);
        $value = $bytes / (1024 ** $power);

        return round($value, 1) . ' ' . $units[(int) $power];
    }
}
