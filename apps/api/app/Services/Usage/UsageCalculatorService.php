<?php

namespace App\Services\Usage;

use App\Services\Bunny\Contracts\BunnyUsageInterface;

class UsageCalculatorService
{
    public function __construct(
        private readonly BunnyUsageInterface $bunnyUsage,
    ) {
    }

    public function calculateStorage(int $tenantId): array
    {
        $usage = $this->bunnyUsage->getTenantUsage($tenantId);
        $streaming = $this->bunnyUsage->getStreamingUsage();

        return [
            'storage_bytes' => $usage['platform_storage_bytes'] ?? 0,
            'stream_storage_bytes' => $streaming['storage_used_bytes'] ?? 0,
            'files_count' => $usage['platform_files_count'] ?? 0,
            'videos_count' => $streaming['videos_count'] ?? 0,
        ];
    }

    public function calculateBandwidth(): array
    {
        $bandwidth = $this->bunnyUsage->getBandwidth();
        $streaming = $this->bunnyUsage->getStreamingUsage();

        return [
            'cdn_bandwidth_bytes' => $bandwidth['bandwidth_used_bytes'] ?? 0,
            'stream_bandwidth_bytes' => $streaming['bandwidth_used_bytes'] ?? 0,
        ];
    }

    public function calculateViews(): array
    {
        $views = $this->bunnyUsage->getViews();

        return [
            'views' => $views['requests_served'] ?? 0,
        ];
    }

    public function calculateRequests(): array
    {
        $requests = $this->bunnyUsage->getRequests();

        return [
            'requests' => $requests['requests_served'] ?? 0,
        ];
    }

    public function calculateStreamUsage(): array
    {
        $streaming = $this->bunnyUsage->getStreamingUsage();

        return [
            'videos_count' => $streaming['videos_count'] ?? 0,
            'storage_used_bytes' => $streaming['storage_used_bytes'] ?? 0,
            'bandwidth_used_bytes' => $streaming['bandwidth_used_bytes'] ?? 0,
        ];
    }

    public function calculateCdnUsage(): array
    {
        $cdn = $this->bunnyUsage->getCdnUsage();

        return [
            'bandwidth_used' => $cdn['pull_zone_bandwidth_used'] ?? 0,
            'traffic_used' => $cdn['pull_zone_traffic_used'] ?? 0,
            'requests_served' => $cdn['requests_served'] ?? 0,
        ];
    }

    public function calculateAll(int $tenantId): array
    {
        $storage = $this->calculateStorage($tenantId);
        $bandwidth = $this->calculateBandwidth();
        $views = $this->calculateViews();
        $requests = $this->calculateRequests();
        $stream = $this->calculateStreamUsage();
        $cdn = $this->calculateCdnUsage();

        return [
            'storage_bytes' => $storage['storage_bytes'],
            'bandwidth_bytes' => $bandwidth['cdn_bandwidth_bytes'],
            'stream_bandwidth_bytes' => $bandwidth['stream_bandwidth_bytes'],
            'cdn_bandwidth_bytes' => $cdn['bandwidth_used'],
            'views' => $views['views'],
            'requests' => $requests['requests'],
            'files_count' => $storage['files_count'],
            'videos_count' => $stream['videos_count'],
        ];
    }
}