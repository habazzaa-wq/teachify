<?php

namespace App\Services\Bunny\Contracts;

interface BunnyAnalyticsInterface
{
    public function getStorageOverTime(?string $dateFrom = null, ?string $dateTo = null): array;

    public function getBandwidthOverTime(?string $dateFrom = null, ?string $dateTo = null): array;

    public function getViews(?string $dateFrom = null, ?string $dateTo = null): array;

    public function getCountries(?string $dateFrom = null, ?string $dateTo = null): array;

    public function getDevices(?string $dateFrom = null, ?string $dateTo = null): array;

    public function getBrowsers(?string $dateFrom = null, ?string $dateTo = null): array;

    public function getOperatingSystems(?string $dateFrom = null, ?string $dateTo = null): array;

    public function getTopFiles(?string $dateFrom = null, ?string $dateTo = null, int $limit = 10): array;

    public function getTopVideos(?string $dateFrom = null, ?string $dateTo = null, int $limit = 10): array;

    public function getMostExpensiveAssets(?string $dateFrom = null, ?string $dateTo = null, int $limit = 10): array;
}
