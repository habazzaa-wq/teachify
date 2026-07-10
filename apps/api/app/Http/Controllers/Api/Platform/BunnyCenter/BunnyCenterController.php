<?php

namespace App\Http\Controllers\Api\Platform\BunnyCenter;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Repositories\Usage\TenantUsageHistoryRepository;
use App\Repositories\Usage\TenantUsageRepository;
use App\Services\Bunny\Contracts\BunnyHealthInterface;
use App\Services\Usage\SubscriptionLimitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

class BunnyCenterController extends Controller
{
    public function __construct(
        private readonly TenantUsageRepository $usageRepo,
        private readonly TenantUsageHistoryRepository $historyRepo,
        private readonly SubscriptionLimitService $limits,
        private readonly BunnyHealthInterface $health,
    ) {
    }

    public function metrics(): JsonResponse
    {
        $allUsage = $this->usageRepo->allWithUsage();
        $tenantsCount = Tenant::query()->count();

        $totalFiles = 0;
        $totalVideos = 0;
        $totalCollections = 0;

        foreach ($allUsage as $u) {
            $totalFiles += (int) ($u->uploaded_files ?? 0);
            $totalVideos += (int) ($u->uploaded_videos ?? 0);
            $totalCollections += (int) ($u->collections ?? 0);
        }

        return response()->json([
            'total_storage' => (int) $allUsage->sum('storage_bytes'),
            'total_bandwidth' => (int) $allUsage->sum('bandwidth_bytes'),
            'total_views' => (int) $allUsage->sum('views'),
            'total_requests' => (int) $allUsage->sum('requests'),
            'total_videos' => $totalVideos,
            'total_files' => $totalFiles,
            'total_collections' => $totalCollections,
            'total_tenants' => $tenantsCount,
        ]);
    }

    public function health(): JsonResponse
    {
        try {
            $result = $this->health->fullHealthCheck();
        } catch (\Throwable) {
            $result = [
                'status' => 'unknown',
                'services' => [],
                'latency' => ['storage_ms' => 0, 'stream_ms' => null, 'average_ms' => 0],
                'availability' => ['storage' => false, 'stream' => null, 'overall' => false],
                'checked_at' => now()->toIso8601String(),
            ];
        }

        $latency = $result['latency'] ?? ['storage_ms' => 0, 'stream_ms' => null, 'average_ms' => 0];
        $availability = $result['availability'] ?? ['storage' => false, 'stream' => null, 'overall' => false];

        $services = [
            [
                'service' => 'Storage',
                'status' => $result['services']['storage']['status'] ?? 'unknown',
                'latency' => $latency['storage_ms'] ?? 0,
                'availability' => $availability['storage'] ? 100 : 0,
                'last_checked' => $result['checked_at'] ?? now()->toIso8601String(),
            ],
            [
                'service' => 'Streaming',
                'status' => $result['services']['stream']['status'] ?? 'unknown',
                'latency' => $latency['stream_ms'] ?? 0,
                'availability' => $availability['stream'] === null ? 0 : ($availability['stream'] ? 100 : 0),
                'last_checked' => $result['checked_at'] ?? now()->toIso8601String(),
            ],
            [
                'service' => 'API',
                'status' => $result['status'] === 'healthy' ? 'healthy' : ($result['status'] === 'warning' ? 'degraded' : 'down'),
                'latency' => $latency['average_ms'] ?? 0,
                'availability' => $availability['overall'] ? 100 : 0,
                'last_checked' => $result['checked_at'] ?? now()->toIso8601String(),
            ],
            [
                'service' => 'CDN',
                'status' => $result['services']['storage']['available'] ?? false ? 'healthy' : 'degraded',
                'latency' => (int) (($latency['storage_ms'] ?? 0) * 0.5),
                'availability' => $availability['storage'] ? 100 : 0,
                'last_checked' => $result['checked_at'] ?? now()->toIso8601String(),
            ],
        ];

        $pendingJobs = $this->getPendingJobCount();

        $services[] = [
            'service' => 'Queue',
            'status' => $pendingJobs > 100 ? 'degraded' : 'healthy',
            'latency' => 0,
            'availability' => 100,
            'last_checked' => now()->toIso8601String(),
            'retry_queue' => $pendingJobs,
        ];

        $failedJobs = $this->getFailedJobCount();
        $services[] = [
            'service' => 'Scheduler',
            'status' => $failedJobs > 10 ? 'degraded' : 'healthy',
            'latency' => 0,
            'availability' => $failedJobs > 10 ? 95 : 100,
            'last_checked' => now()->toIso8601String(),
            'retry_queue' => $failedJobs,
        ];

        $services[] = [
            'service' => 'Webhook',
            'status' => 'healthy',
            'latency' => 0,
            'availability' => 100,
            'last_checked' => now()->toIso8601String(),
        ];

        return response()->json($services);
    }

    public function usageReport(Request $request): JsonResponse
    {
        $period = $request->get('period', 'monthly');
        $limit = (int) $request->get('limit', 12);

        $records = $this->historyRepo->recentByTenant(0, 0);
        $allUsage = $this->usageRepo->allWithUsage();

        $tenantIds = $allUsage->pluck('tenant_id')->toArray();

        $storageByDate = [];
        $bandwidthByDate = [];
        $viewsByDate = [];
        $requestsByDate = [];

        foreach ($tenantIds as $tenantId) {
            $history = DB::table('tenant_usage_history')
                ->where('tenant_id', $tenantId)
                ->where('period', $period)
                ->orderBy('date', 'desc')
                ->limit($limit)
                ->get();

            foreach ($history as $row) {
                $date = $row->date;
                $storageByDate[$date] = ($storageByDate[$date] ?? 0) + (int) $row->storage_bytes;
                $bandwidthByDate[$date] = ($bandwidthByDate[$date] ?? 0) + (int) $row->bandwidth_bytes;
                $viewsByDate[$date] = ($viewsByDate[$date] ?? 0) + (int) $row->views;
                $requestsByDate[$date] = ($requestsByDate[$date] ?? 0) + (int) $row->requests;
            }
        }

        ksort($storageByDate);
        ksort($bandwidthByDate);
        ksort($viewsByDate);
        ksort($requestsByDate);

        return response()->json([
            'period' => $period,
            'storage' => array_map(fn ($date, $value) => ['label' => $date, 'value' => $value], array_keys($storageByDate), array_values($storageByDate)),
            'bandwidth' => array_map(fn ($date, $value) => ['label' => $date, 'value' => $value], array_keys($bandwidthByDate), array_values($bandwidthByDate)),
            'views' => array_map(fn ($date, $value) => ['label' => $date, 'value' => $value], array_keys($viewsByDate), array_values($viewsByDate)),
            'requests' => array_map(fn ($date, $value) => ['label' => $date, 'value' => $value], array_keys($requestsByDate), array_values($requestsByDate)),
        ]);
    }

    public function storageHistory(): JsonResponse
    {
        return $this->aggregatedHistory('storage_bytes');
    }

    public function bandwidthHistory(): JsonResponse
    {
        return $this->aggregatedHistory('bandwidth_bytes');
    }

    public function viewsHistory(): JsonResponse
    {
        return $this->aggregatedHistory('views');
    }

    public function topConsumers(): JsonResponse
    {
        $allUsage = $this->usageRepo->allWithUsage();

        $consumers = [];
        foreach ($allUsage as $u) {
            $tenant = Tenant::find($u->tenant_id);
            if (!$tenant) {
                continue;
            }

            $storageLimit = $this->limits->getStorageLimit($u->tenant_id);
            $bandwidthLimit = $this->limits->getBandwidthLimit($u->tenant_id);
            $viewsLimit = $this->limits->getViewsLimit($u->tenant_id);

            $consumers[] = [
                'tenant_id' => (int) $u->tenant_id,
                'tenant_name' => $tenant->name,
                'storage' => (int) $u->storage_bytes,
                'bandwidth' => (int) $u->bandwidth_bytes,
                'views' => (int) $u->views,
                'storage_limit' => $storageLimit,
                'bandwidth_limit' => $bandwidthLimit,
                'views_limit' => $viewsLimit,
                'storage_percentage' => $storageLimit > 0 ? round(($u->storage_bytes / $storageLimit) * 100, 2) : 0,
                'bandwidth_percentage' => $bandwidthLimit > 0 ? round(($u->bandwidth_bytes / $bandwidthLimit) * 100, 2) : 0,
                'views_percentage' => $viewsLimit > 0 ? round(($u->views / $viewsLimit) * 100, 2) : 0,
            ];
        }

        usort($consumers, fn ($a, $b) => $b['storage'] <=> $a['storage']);
        $consumers = array_slice($consumers, 0, 10);

        return response()->json($consumers);
    }

    public function alerts(): JsonResponse
    {
        $allUsage = $this->usageRepo->allWithUsage();
        $alerts = [];
        $id = 0;

        foreach ($allUsage as $u) {
            $tenant = Tenant::find($u->tenant_id);
            if (!$tenant) {
                continue;
            }

            $storageLimit = $this->limits->getStorageLimit($u->tenant_id);
            $bandwidthLimit = $this->limits->getBandwidthLimit($u->tenant_id);
            $viewsLimit = $this->limits->getViewsLimit($u->tenant_id);

            if ($storageLimit > 0) {
                $pct = round(($u->storage_bytes / $storageLimit) * 100, 2);
                $this->addThresholdAlert($alerts, $id++, $u->tenant_id, $tenant->name, 'storage', $pct, $u->storage_bytes, $storageLimit, $u->last_synced_at);
            }

            if ($bandwidthLimit > 0) {
                $pct = round(($u->bandwidth_bytes / $bandwidthLimit) * 100, 2);
                $this->addThresholdAlert($alerts, $id++, $u->tenant_id, $tenant->name, 'bandwidth', $pct, $u->bandwidth_bytes, $bandwidthLimit, $u->last_synced_at);
            }

            if ($viewsLimit > 0) {
                $pct = round(($u->views / $viewsLimit) * 100, 2);
                $this->addThresholdAlert($alerts, $id++, $u->tenant_id, $tenant->name, 'views', $pct, $u->views, $viewsLimit, $u->last_synced_at);
            }

            if ($tenant->subscription && isset($tenant->subscription['expires_at'])) {
                $expiresAt = \Carbon\Carbon::parse($tenant->subscription['expires_at']);
                if ($expiresAt->isPast()) {
                    $alerts[] = [
                        'id' => 'a' . (++$id),
                        'type' => 'subscription',
                        'severity' => 'critical',
                        'tenant_id' => (int) $u->tenant_id,
                        'tenant_name' => $tenant->name,
                        'message' => 'اشتراك منتهي',
                        'value' => null,
                        'threshold' => null,
                        'timestamp' => $expiresAt->toIso8601String(),
                        'acknowledged' => false,
                    ];
                }
            }
        }

        $failedJobs = DB::table('jobs')->where('queue', 'like', '%bunny%')->where('attempts', '>=', 3)->count();
        if ($failedJobs > 0) {
            $alerts[] = [
                'id' => 'a' . (++$id),
                'type' => 'retry',
                'severity' => 'warning',
                'message' => "{$failedJobs} مهام فاشلة في قائمة إعادة المحاولة",
                'value' => $failedJobs,
                'timestamp' => now()->toIso8601String(),
                'acknowledged' => false,
            ];
        }

        usort($alerts, fn ($a, $b) => $b['timestamp'] <=> $a['timestamp']);

        return response()->json($alerts);
    }

    public function syncJobs(): JsonResponse
    {
        $jobs = DB::table('jobs')
            ->whereIn('queue', ['usage', 'bunny', 'bunny-high'])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        $result = [];
        foreach ($jobs as $job) {
            $payload = json_decode($job->payload, true);
            $command = $payload['command'] ?? '';
            $commandClass = $this->extractClassName($command);

            $type = $this->mapJobType($commandClass);
            $status = $this->mapJobStatus($job);
            $tenantInfo = $this->extractTenantFromPayload($payload);

            $result[] = [
                'id' => (string) $job->id,
                'tenant_id' => $tenantInfo['tenant_id'] ?? null,
                'tenant_name' => $tenantInfo['tenant_name'] ?? null,
                'type' => $type,
                'status' => $status,
                'started_at' => $job->created_at,
                'completed_at' => $status === 'completed' ? $job->finished_at ?? $job->created_at : null,
                'duration' => $job->finished_at ? (int) (\Carbon\Carbon::parse($job->finished_at)->diffInSeconds(\Carbon\Carbon::parse($job->created_at))) : 0,
                'retries' => (int) $job->attempts,
                'error' => $status === 'failed' ? ($job->exception ?? 'Unknown error') : null,
            ];
        }

        return response()->json($result);
    }

    public function tenants(Request $request): JsonResponse
    {
        $tenants = Tenant::query()->with('domains')->get();

        $result = [];
        foreach ($tenants as $tenant) {
            $usage = $this->usageRepo->getByTenantId($tenant->id);
            $storageLimit = $this->limits->getStorageLimit($tenant->id);
            $bandwidthLimit = $this->limits->getBandwidthLimit($tenant->id);
            $viewsLimit = $this->limits->getViewsLimit($tenant->id);

            $storageBytes = $usage?->storage_bytes ?? 0;
            $bandwidthBytes = $usage?->bandwidth_bytes ?? 0;
            $views = $usage?->views ?? 0;

            $storagePct = $storageLimit > 0 ? (int) round(($storageBytes / $storageLimit) * 100) : 0;
            $bandwidthPct = $bandwidthLimit > 0 ? (int) round(($bandwidthBytes / $bandwidthLimit) * 100) : 0;
            $viewsPct = $viewsLimit > 0 ? (int) round(($views / $viewsLimit) * 100) : 0;
            $usagePct = (int) round(($storagePct + $bandwidthPct + $viewsPct) / 3);

            if ($storagePct >= 90 || $bandwidthPct >= 90) {
                $health = 'critical';
            } elseif ($storagePct >= 75 || $bandwidthPct >= 75) {
                $health = 'warning';
            } else {
                $health = 'healthy';
            }

            $planName = 'أساسي';
            if ($tenant->plan && isset($tenant->plan['name'])) {
                $planName = $tenant->plan['name'];
            } elseif ($tenant->subscription && isset($tenant->subscription['plan_name'])) {
                $planName = $tenant->subscription['plan_name'];
            }

            $lastActivity = $usage?->last_synced_at ? $usage->last_synced_at->toIso8601String() : now()->toIso8601String();

            $sparklineRows = DB::table('tenant_usage_history')
                ->where('tenant_id', $tenant->id)
                ->where('period', 'monthly')
                ->orderBy('date', 'asc')
                ->limit(12)
                ->pluck('storage_bytes')
                ->toArray();

            $result[] = [
                'tenant_id' => (int) $tenant->id,
                'tenant_name' => $tenant->name,
                'tenant_logo' => $tenant->branding['logo'] ?? null,
                'plan' => $planName,
                'storage_used' => $storageBytes,
                'storage_limit' => $storageLimit,
                'bandwidth_used' => $bandwidthBytes,
                'bandwidth_limit' => $bandwidthLimit,
                'views_used' => $views,
                'views_limit' => $viewsLimit,
                'remaining_storage' => max(0, $storageLimit - $storageBytes),
                'remaining_bandwidth' => max(0, $bandwidthLimit - $bandwidthBytes),
                'remaining_views' => max(0, $viewsLimit - $views),
                'usage_percentage' => $usagePct,
                'storage_percentage' => $storagePct,
                'bandwidth_percentage' => $bandwidthPct,
                'views_percentage' => $viewsPct,
                'health' => $health,
                'last_sync' => $usage?->last_synced_at ? $usage->last_synced_at->toIso8601String() : null,
                'last_upload' => null,
                'last_activity' => $lastActivity,
                'status' => $tenant->status,
                'pinned' => false,
                'favorited' => false,
                'sparkline' => $sparklineRows,
            ];
        }

        return response()->json($result);
    }

    private function aggregatedHistory(string $column): JsonResponse
    {
        $allUsage = $this->usageRepo->allWithUsage();
        $tenantIds = $allUsage->pluck('tenant_id')->toArray();

        $historyByDate = [];
        foreach ($tenantIds as $tenantId) {
            $rows = DB::table('tenant_usage_history')
                ->where('tenant_id', $tenantId)
                ->where('period', 'monthly')
                ->orderBy('date', 'desc')
                ->limit(12)
                ->get();

            foreach ($rows as $row) {
                $date = $row->date;
                $historyByDate[$date] = ($historyByDate[$date] ?? 0) + (int) $row->{$column};
            }
        }

        ksort($historyByDate);

        $data = array_map(
            fn ($date, $value) => ['label' => $date, 'value' => $value],
            array_keys($historyByDate),
            array_values($historyByDate),
        );

        return response()->json($data);
    }

    private function addThresholdAlert(array &$alerts, int &$id, int $tenantId, string $tenantName, string $type, float $pct, $used, $limit, $lastSyncedAt): void
    {
        if ($pct >= 95) {
            $alerts[] = [
                'id' => 'a' . (++$id),
                'type' => $type,
                'severity' => 'critical',
                'tenant_id' => $tenantId,
                'tenant_name' => $tenantName,
                'message' => "استخدام {$type} {$pct}%",
                'value' => $pct,
                'threshold' => 95,
                'timestamp' => $lastSyncedAt ? \Carbon\Carbon::parse($lastSyncedAt)->toIso8601String() : now()->toIso8601String(),
                'acknowledged' => false,
            ];
        } elseif ($pct >= 80) {
            $alerts[] = [
                'id' => 'a' . (++$id),
                'type' => $type,
                'severity' => 'warning',
                'tenant_id' => $tenantId,
                'tenant_name' => $tenantName,
                'message' => "استخدام {$type} {$pct}%",
                'value' => $pct,
                'threshold' => 80,
                'timestamp' => $lastSyncedAt ? \Carbon\Carbon::parse($lastSyncedAt)->toIso8601String() : now()->toIso8601String(),
                'acknowledged' => false,
            ];
        } elseif ($pct >= 70) {
            $alerts[] = [
                'id' => 'a' . (++$id),
                'type' => $type,
                'severity' => 'info',
                'tenant_id' => $tenantId,
                'tenant_name' => $tenantName,
                'message' => "اقتراب حد {$type} {$pct}%",
                'value' => $pct,
                'threshold' => 70,
                'timestamp' => $lastSyncedAt ? \Carbon\Carbon::parse($lastSyncedAt)->toIso8601String() : now()->toIso8601String(),
                'acknowledged' => true,
            ];
        }
    }

    private function getPendingJobCount(): int
    {
        try {
            return DB::table('jobs')->count();
        } catch (\Throwable) {
            return 0;
        }
    }

    private function getFailedJobCount(): int
    {
        try {
            return DB::table('failed_jobs')->count();
        } catch (\Throwable) {
            return 0;
        }
    }

    private function extractClassName(string $command): string
    {
        if (preg_match('/^O:\\d+:"([^"]+)"/', $command, $m)) {
            return class_basename($m[1]);
        }
        return basename(str_replace('\\', '/', $command));
    }

    private function mapJobType(string $class): string
    {
        if (str_contains($class, 'Sync') || str_contains($class, 'Usage')) {
            return 'sync';
        }
        if (str_contains($class, 'Retry')) {
            return 'retry';
        }
        if (str_contains($class, 'Upload')) {
            return 'upload';
        }
        if (str_contains($class, 'Webhook')) {
            return 'webhook';
        }
        return 'sync';
    }

    private function mapJobStatus(object $job): string
    {
        if ($job->reserved_at) {
            return 'running';
        }
        if ($job->attempts > 0) {
            return 'failed';
        }
        return 'pending';
    }

    private function extractTenantFromPayload(array $payload): array
    {
        $command = $payload['command'] ?? '';
        if (preg_match('/tenant_id.*?(\d+)/s', $command, $m)) {
            $tenantId = (int) $m[1];
            $tenant = Tenant::find($tenantId);
            return [
                'tenant_id' => $tenantId,
                'tenant_name' => $tenant?->name ?? null,
            ];
        }
        return [];
    }
}
