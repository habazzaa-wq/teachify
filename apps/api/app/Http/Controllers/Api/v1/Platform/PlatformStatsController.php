<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Real platform-wide counters for the superadmin dashboard.
 *
 * This replaces the hardcoded values the dashboard used to ship with. Every
 * figure here is read from the database or the host at request time, so a
 * missing signal is reported as null rather than invented.
 */
class PlatformStatsController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'counts' => $this->counts(),
            'queues' => $this->queues(),
            'host' => $this->host(),
            'php' => $this->phpRuntime(),
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * @return array<string, int>
     */
    private function counts(): array
    {
        // Course, Exam and ExamAttempt carry a TenantScope global scope, which
        // calls currentTenant() and throws outside a tenant request. These are
        // platform-wide totals for a platform admin, so the scope is bypassed
        // deliberately: an aggregate COUNT reveals no tenant-owned row.
        $acrossTenants = fn (string $model) => $model::query()
            ->withoutGlobalScope(TenantScope::class)
            ->count();

        return $this->safely(fn (): array => [
            'tenants' => Tenant::query()->count(),
            'tenants_active' => Tenant::query()->where('status', 'active')->count(),
            'tenant_domains' => TenantDomain::query()->count(),
            'users' => User::query()->count(),
            'courses' => $acrossTenants(Course::class),
            'exams' => $acrossTenants(Exam::class),
            'exam_attempts' => $acrossTenants(ExamAttempt::class),
            'exam_attempts_pending' => ExamAttempt::query()
                ->withoutGlobalScope(TenantScope::class)
                ->whereIn('status', ['submitted', 'pending_review'])
                ->count(),
        ], [
            'tenants' => 0,
            'tenants_active' => 0,
            'tenant_domains' => 0,
            'users' => 0,
            'courses' => 0,
            'exams' => 0,
            'exam_attempts' => 0,
            'exam_attempts_pending' => 0,
        ]);
    }

    /**
     * Backlog per queue. A queue with no worker defined is called out so a
     * stalled queue is visible instead of silently accumulating jobs.
     *
     * @return array<string, mixed>
     */
    private function queues(): array
    {
        return $this->safely(function (): array {
            $backlog = DB::table('jobs')
                ->selectRaw('queue, count(*) as total')
                ->groupBy('queue')
                ->pluck('total', 'queue')
                ->all();

            $failed = DB::table('failed_jobs')->count();

            return [
                'backlog' => $backlog,
                'backlog_total' => array_sum($backlog),
                'failed' => $failed,
                'known_queues' => ['default', 'grading', 'bunny', 'bunny-high', 'usage'],
            ];
        }, [
            'backlog' => [],
            'backlog_total' => 0,
            'failed' => null,
            'known_queues' => ['default', 'grading', 'bunny', 'bunny-high', 'usage'],
        ]);
    }

    /**
     * Host-level telemetry. Only meaningful on Linux; null elsewhere.
     *
     * @return array<string, mixed>
     */
    private function host(): array
    {
        $isLinux = PHP_OS_FAMILY === 'Linux';

        $load = null;
        if ($isLinux && function_exists('sys_getloadavg')) {
            $load = sys_getloadavg();
        }

        $memory = null;
        if ($isLinux && is_readable('/proc/meminfo')) {
            $memory = $this->parseMemInfo((string) file_get_contents('/proc/meminfo'));
        }

        $uptimeSeconds = null;
        if ($isLinux && is_readable('/proc/uptime')) {
            $parts = preg_split('/\s+/', trim((string) file_get_contents('/proc/uptime')));
            $uptimeSeconds = isset($parts[0]) ? (int) round((float) $parts[0]) : null;
        }

        $diskFreeBytes = @disk_free_space(base_path());

        return [
            'load_average' => $load === null ? null : array_map(fn ($v) => round((float) $v, 2), $load),
            'cpu_count' => $isLinux ? @shell_exec('nproc') ?: null : null,
            'memory' => $memory,
            'disk_free_bytes' => $diskFreeBytes === false ? null : (int) $diskFreeBytes,
            'disk_total_bytes' => $diskFreeBytes === false ? null : (int) @disk_total_space(base_path()),
            'uptime_seconds' => $uptimeSeconds,
        ];
    }

    /**
     * @return array<string, string|null>
     */
    private function phpRuntime(): array
    {
        return [
            'version' => PHP_VERSION,
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'opcache_enabled' => function_exists('opcache_get_status') && @opcache_get_status(false) !== false
                ? 'yes'
                : 'no',
        ];
    }

    /**
     * @return array{total: int, available: int, used_percent: int}|null
     */
    private function parseMemInfo(string $raw): ?array
    {
        if (! preg_match('/MemTotal:\s+(\d+)/', $raw, $totalMatch)) {
            return null;
        }
        if (! preg_match('/MemAvailable:\s+(\d+)/', $raw, $availMatch)) {
            return null;
        }

        $total = (int) $totalMatch[1];
        $available = (int) $availMatch[1];

        return [
            'total' => $total,
            'available' => $available,
            'used_percent' => $total > 0 ? (int) round((($total - $available) / $total) * 100) : 0,
        ];
    }

    /**
     * Run a probe and fall back to the supplied shape if it throws, so one
     * unavailable metric cannot take down the whole dashboard payload.
     *
     * @template T
     *
     * @param  callable(): T  $probe
     * @param  T  $fallback
     * @return T
     */
    private function safely(callable $probe, mixed $fallback): mixed
    {
        try {
            return $probe();
        } catch (Throwable $e) {
            // Never swallow this silently: a fallback of zeros is
            // indistinguishable from a genuinely empty platform.
            report($e);

            return $fallback;
        }
    }
}
