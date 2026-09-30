<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseCompletion;
use App\Models\CourseEnrollment;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\IssuedCertificate;
use App\Models\MediaAsset;
use App\Models\Question;
use App\Models\RechargeCode;
use App\Models\TenantUser;
use App\Models\WalletTransaction;
use App\Services\Media\MediaLibraryAssetService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class TeacherDashboardController extends Controller
{
    /** Allowed preset periods. */
    private const PERIODS = ['today', '7d', '30d', '90d', '180d', '12m', 'all', 'custom'];

    public function __construct(
        private readonly MediaLibraryAssetService $media,
    ) {
    }

    public function stats(Request $request): JsonResponse
    {
        $tenant = currentTenant();
        $tenantId = $tenant->id;
        $now = now();

        $filters = $this->resolveFilters($request, $now);
        $from = $filters['from'];
        $to = $filters['to'];
        $prevFrom = $filters['prev_from'];
        $prevTo = $filters['prev_to'];

        $range = static function (Builder $query, ?Carbon $f, ?Carbon $t, string $column = 'created_at'): Builder {
            return $query
                ->when($f !== null, fn (Builder $q): Builder => $q->where($column, '>=', $f))
                ->when($t !== null, fn (Builder $q): Builder => $q->where($column, '<=', $t));
        };

        $count = static fn (Builder $query, ?Carbon $f, ?Carbon $t): int => $query->clone()->count();
        $countBetween = static fn (Builder $query, ?Carbon $f, ?Carbon $t): int => $range($query->clone(), $f, $t)->count();

        // ── Students ──────────────────────────────────────────────────────────
        $studentQuery = fn (): Builder => TenantUser::query()
            ->where('tenant_id', $tenantId)
            ->whereHas('roles', fn ($q) => $q->where('slug', 'student'));

        $studentsTotal = $count($studentQuery(), null, null);
        $studentsActive = $count($studentQuery()->where('status', 'active'), null, null);
        $studentsNewPeriod = $countBetween($studentQuery(), $from, $to);
        $studentsPrev = $countBetween($studentQuery(), $prevFrom, $prevTo);

        // ── Courses ──────────────────────────────────────────────────────────
        $coursesQuery = fn (): Builder => Course::query()->where('tenant_id', $tenantId);
        $coursesTotal = $count($coursesQuery(), null, null);
        $coursesPublished = $count($coursesQuery()->where('status', 'published'), null, null);
        $coursesPeriod = $countBetween($coursesQuery(), $from, $to);
        $coursesPrev = $countBetween($coursesQuery(), $prevFrom, $prevTo);

        // ── Enrollments ───────────────────────────────────────────────────────
        $enrollmentsQuery = fn (): Builder => CourseEnrollment::query()->where('tenant_id', $tenantId);
        $enrollmentsTotal = $count($enrollmentsQuery(), null, null);
        $enrollmentsActive = $count($enrollmentsQuery()->where('status', 'active'), null, null);
        $enrollmentsCompleted = $count($enrollmentsQuery()->where('status', 'completed'), null, null);
        $enrollmentsPeriod = $countBetween($enrollmentsQuery(), $from, $to);
        $enrollmentsPrev = $countBetween($enrollmentsQuery(), $prevFrom, $prevTo);

        // ── Exams & attempts ──────────────────────────────────────────────────
        $examsTotal = $count(Exam::query()->where('tenant_id', $tenantId), null, null);
        $examsPublished = $count(Exam::query()->where('tenant_id', $tenantId)->where('status', 'published'), null, null);
        $questionsTotal = Question::query()->where('tenant_id', $tenantId)->whereNull('deleted_at')->count();

        $attemptsQuery = fn (): Builder => ExamAttempt::query()->where('tenant_id', $tenantId)->where('status', 'submitted');
        $attemptsTotal = $count($attemptsQuery(), null, null);
        $attemptsPassed = $count($attemptsQuery()->where('passed', true), null, null);
        $attemptsPeriod = $countBetween($attemptsQuery(), $from, $to, 'submitted_at');
        $attemptsPrev = $countBetween($attemptsQuery(), $prevFrom, $prevTo, 'submitted_at');

        $passedPeriod = $countBetween($attemptsQuery()->where('passed', true), $from, $to, 'submitted_at');
        $passedPrev = $countBetween($attemptsQuery()->where('passed', true), $prevFrom, $prevTo, 'submitted_at');
        $avgScorePeriod = $this->averageScoreBetween($tenantId, $from, $to);

        // ── Revenue (course purchases via wallet debits) ──────────────────────
        $revenueQuery = fn (): Builder => WalletTransaction::query()->where('tenant_id', $tenantId)->where('type', 'debit');

        $revenueTotal = (float) $revenueQuery()->sum('amount');
        $revenuePeriod = (float) $range($revenueQuery(), $from, $to)->sum('amount');
        $revenuePrev = (float) $range($revenueQuery(), $prevFrom, $prevTo)->sum('amount');
        $revenueToday = (float) $range($revenueQuery(), $now->copy()->startOfDay(), $now)->sum('amount');
        $revenueTransactionsTotal = $revenueQuery()->count();
        $revenueTransactionsPeriod = $range($revenueQuery(), $from, $to)->count();
        $revenueAvgPerDay = $filters['days'] > 0 ? round($revenuePeriod / $filters['days'], 2) : $revenuePeriod;

        // ── Certificates ──────────────────────────────────────────────────────
        $certificatesQuery = fn (): Builder => IssuedCertificate::query()->where('tenant_id', $tenantId);
        $certificatesTotal = $count($certificatesQuery(), null, null);
        $certificatesPeriod = $countBetween($certificatesQuery(), $from, $to, 'issued_at');
        $certificatesPrev = $countBetween($certificatesQuery(), $prevFrom, $prevTo, 'issued_at');

        // ── Completions ───────────────────────────────────────────────────────
        $completionsQuery = fn (): Builder => CourseCompletion::query()->where('tenant_id', $tenantId);
        $completionsTotal = $count($completionsQuery(), null, null);
        $completionsPeriod = $countBetween($completionsQuery(), $from, $to, 'completed_at');
        $completionsPrev = $countBetween($completionsQuery(), $prevFrom, $prevTo, 'completed_at');
        $completionRate = $enrollmentsActive > 0
            ? round(($completionsTotal / $enrollmentsActive) * 100, 1)
            : 0;

        // ── Recharge codes ────────────────────────────────────────────────────
        $rechargeCodesTotal = RechargeCode::query()->where('tenant_id', $tenantId)->count();
        $rechargeCodesActive = RechargeCode::query()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->count();
        $codesRedeemedPeriod = WalletTransaction::query()
            ->where('tenant_id', $tenantId)
            ->where('type', 'credit')
            ->whereNotNull('recharge_code_id')
            ->when($from, fn (Builder $q): Builder => $q->where('created_at', '>=', $from))
            ->when($to, fn (Builder $q): Builder => $q->where('created_at', '<=', $to))
            ->count();

        // ── Media / storage ───────────────────────────────────────────────────
        $storage = $this->media->storageUsage($tenant);
        $mediaTotal = MediaAsset::query()->where('tenant_id', $tenantId)->count();
        $mediaVideos = MediaAsset::query()->where('tenant_id', $tenantId)->where('type', 'video')->count();

        // ── Trends (bucketed series) ──────────────────────────────────────────
        $granularity = $filters['granularity'];
        $trendFrom = $from ?? $now->copy()->startOfMonth()->subMonths(11)->startOfMonth();
        $trendTo = $to ?? $now;

        $trends = [
            'revenue' => $this->trendSeries(
                fn (Carbon $f, Carbon $t) => (float) $range($revenueQuery(), $f, $t)->sum('amount'),
                $trendFrom, $trendTo, $granularity,
            ),
            'enrollments' => $this->trendSeries(
                fn (Carbon $f, Carbon $t) => $countBetween($enrollmentsQuery(), $f, $t),
                $trendFrom, $trendTo, $granularity,
            ),
            'students_new' => $this->trendSeries(
                fn (Carbon $f, Carbon $t) => $countBetween($studentQuery(), $f, $t),
                $trendFrom, $trendTo, $granularity,
            ),
            'exam_attempts' => $this->trendSeries(
                fn (Carbon $f, Carbon $t) => $countBetween($attemptsQuery(), $f, $t, 'submitted_at'),
                $trendFrom, $trendTo, $granularity,
            ),
            'exam_pass_rate' => $this->trendPassRate($attemptsQuery(), $trendFrom, $trendTo, $granularity),
            'certificates' => $this->trendSeries(
                fn (Carbon $f, Carbon $t) => $countBetween($certificatesQuery(), $f, $t, 'issued_at'),
                $trendFrom, $trendTo, $granularity,
            ),
            'completions' => $this->trendSeries(
                fn (Carbon $f, Carbon $t) => $countBetween($completionsQuery(), $f, $t, 'completed_at'),
                $trendFrom, $trendTo, $granularity,
            ),
        ];

        // ── Top courses ───────────────────────────────────────────────────────
        $topCourses = Course::query()
            ->where('courses.tenant_id', $tenantId)
            ->withCount(['enrollments' => fn ($q) => $q->where('status', 'active')])
            ->limit(30)
            ->get()
            ->map(function (Course $course) use ($tenantId, $from, $to) {
                $studentsTotal = $course->enrollments_count;
                $studentsPeriod = CourseEnrollment::query()
                    ->where('tenant_id', $tenantId)
                    ->where('course_id', $course->id)
                    ->when($from, fn (Builder $q): Builder => $q->where('created_at', '>=', $from))
                    ->when($to, fn (Builder $q): Builder => $q->where('created_at', '<=', $to))
                    ->count();

                $completionsTotal = CourseCompletion::query()
                    ->where('tenant_id', $tenantId)
                    ->where('course_id', $course->id)
                    ->count();
                $completionsPeriod = CourseCompletion::query()
                    ->where('tenant_id', $tenantId)
                    ->where('course_id', $course->id)
                    ->when($from, fn (Builder $q): Builder => $q->where('completed_at', '>=', $from))
                    ->when($to, fn (Builder $q): Builder => $q->where('completed_at', '<=', $to))
                    ->count();

                $revenueTotal = (float) WalletTransaction::query()
                    ->where('tenant_id', $tenantId)
                    ->where('type', 'debit')
                    ->where('description', 'like', '%'.$course->title.'%')
                    ->sum('amount');
                $revenuePeriod = (float) WalletTransaction::query()
                    ->where('tenant_id', $tenantId)
                    ->where('type', 'debit')
                    ->where('description', 'like', '%'.$course->title.'%')
                    ->when($from, fn (Builder $q): Builder => $q->where('created_at', '>=', $from))
                    ->when($to, fn (Builder $q): Builder => $q->where('created_at', '<=', $to))
                    ->sum('amount');

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'slug' => $course->slug,
                    'status' => $course->status,
                    'thumbnail' => $course->thumbnail_path,
                    'students_total' => $studentsTotal,
                    'students_period' => $studentsPeriod,
                    'completions_total' => $completionsTotal,
                    'completions_period' => $completionsPeriod,
                    'completion_rate' => $studentsTotal > 0 ? round(($completionsTotal / $studentsTotal) * 100, 1) : 0,
                    'revenue_total' => round($revenueTotal, 2),
                    'revenue_period' => round($revenuePeriod, 2),
                ];
            })
            ->sortByDesc(fn (array $course) => [$course['students_period'], $course['students_total']])
            ->take(5)
            ->values();

        // ── Exam performance breakdown ────────────────────────────────────────
        $examPerformance = $this->examPerformance($tenantId, $from, $to);

        // ── Recent activity (scoped to the selected period) ───────────────────
        $recentActivity = $this->recentActivity($tenantId, $from, $to, 8);

        // ── Subscription ──────────────────────────────────────────────────────
        $subscription = $tenant->subscription ?? [];
        $plan = $tenant->plan ?? [];
        $subscriptionPeriodEnd = isset($subscription['ends_at']) ? Carbon::parse($subscription['ends_at']) : null;
        $subscriptionDaysLeft = (int) ($subscriptionPeriodEnd?->diffInDays($now, false) ?? 0);
        $trialDaysRemaining = (int) ($subscription['trial_days_remaining'] ?? 0);
        $subscriptionProgress = $this->subscriptionProgress($subscription);

        $delta = static fn (float $current, float $previous): float => $previous > 0
            ? round((($current - $previous) / $previous) * 100, 1)
            : 0.0;

        return response()->json([
            'filters' => [
                'period' => $filters['period'],
                'from' => $from?->toDateString(),
                'to' => $to?->toDateString(),
                'granularity' => $granularity,
                'bucket_count' => $filters['bucket_count'],
                'bucket_label' => $this->granularityLabel($granularity),
                'days' => $filters['days'],
            ],
            'periods' => [
                'current' => [
                    'from' => $from?->toDateString(),
                    'to' => $to?->toDateString(),
                ],
                'previous' => [
                    'from' => $prevFrom?->toDateString(),
                    'to' => $prevTo?->toDateString(),
                ],
            ],
            'summary' => [
                'students' => [
                    'total' => $studentsTotal,
                    'active' => $studentsActive,
                    'new_period' => $studentsNewPeriod,
                    'previous_period' => $studentsPrev,
                    'change_percent' => $delta($studentsNewPeriod, $studentsPrev),
                ],
                'courses' => [
                    'total' => $coursesTotal,
                    'published' => $coursesPublished,
                    'created_period' => $coursesPeriod,
                    'previous_period' => $coursesPrev,
                    'change_percent' => $delta($coursesPeriod, $coursesPrev),
                ],
                'enrollments' => [
                    'total' => $enrollmentsTotal,
                    'active' => $enrollmentsActive,
                    'completed' => $enrollmentsCompleted,
                    'new_period' => $enrollmentsPeriod,
                    'previous_period' => $enrollmentsPrev,
                    'change_percent' => $delta($enrollmentsPeriod, $enrollmentsPrev),
                ],
                'exams' => [
                    'total' => $examsTotal,
                    'published' => $examsPublished,
                    'questions' => $questionsTotal,
                    'attempts_total' => $attemptsTotal,
                    'attempts_submitted' => $attemptsTotal,
                    'attempts_passed' => $attemptsPassed,
                    'attempts_period' => $attemptsPeriod,
                    'previous_period' => $attemptsPrev,
                    'passed_period' => $passedPeriod,
                    'pass_rate_total' => $attemptsTotal > 0 ? round(($attemptsPassed / $attemptsTotal) * 100, 1) : 0,
                    'pass_rate_period' => $attemptsPeriod > 0 ? round(($passedPeriod / $attemptsPeriod) * 100, 1) : 0,
                    'avg_score_period' => $avgScorePeriod,
                    'change_percent' => $delta($attemptsPeriod, $attemptsPrev),
                ],
                'revenue' => [
                    'total' => round($revenueTotal, 2),
                    'period' => round($revenuePeriod, 2),
                    'today' => round($revenueToday, 2),
                    'previous_period' => round($revenuePrev, 2),
                    'change_percent' => $delta($revenuePeriod, $revenuePrev),
                    'avg_per_day' => $revenueAvgPerDay,
                    'transactions_total' => $revenueTransactionsTotal,
                    'transactions_period' => $revenueTransactionsPeriod,
                ],
                'certificates' => [
                    'total' => $certificatesTotal,
                    'issued_period' => $certificatesPeriod,
                    'previous_period' => $certificatesPrev,
                    'change_percent' => $delta($certificatesPeriod, $certificatesPrev),
                ],
                'completions' => [
                    'total' => $completionsTotal,
                    'period' => $completionsPeriod,
                    'previous_period' => $completionsPrev,
                    'rate' => $completionRate,
                    'change_percent' => $delta($completionsPeriod, $completionsPrev),
                ],
                'recharge_codes' => [
                    'total' => $rechargeCodesTotal,
                    'active' => $rechargeCodesActive,
                    'redeemed_period' => $codesRedeemedPeriod,
                ],
                'media' => [
                    'total' => $mediaTotal,
                    'videos' => $mediaVideos,
                ],
                'storage' => $storage,
                'subscription' => [
                    'plan' => $plan['name'] ?? $tenant->subscription['plan'] ?? 'خطة أساسية',
                    'days_left' => max(0, $subscriptionDaysLeft),
                    'progress' => $subscriptionProgress,
                    'trial_days_remaining' => max(0, $trialDaysRemaining),
                    'status' => $tenant->status,
                ],
            ],
            'trends' => $trends,
            'breakdowns' => [
                'top_courses' => $topCourses,
                'exam_performance' => $examPerformance,
            ],
            'recent_activity' => $recentActivity,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Filters
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Resolve the requested reporting window into concrete date bounds.
     *
     * @return array{
     *     period: string,
     *     from: ?Carbon,
     *     to: Carbon,
     *     prev_from: ?Carbon,
     *     prev_to: ?Carbon,
     *     granularity: string,
     *     bucket_count: int,
     *     days: int,
     * }
     */
    private function resolveFilters(Request $request, Carbon $now): array
    {
        $period = $request->string('period')->toString();
        if (! in_array($period, self::PERIODS, true)) {
            $period = 'all';
        }

        $customFrom = $request->input('from');
        $customTo = $request->input('to');

        if ($customFrom || $customTo) {
            $period = 'custom';
            $customFromParsed = $customFrom ? Carbon::parse($customFrom)->startOfDay() : null;
            $customToParsed = $customTo ? Carbon::parse($customTo)->endOfDay() : null;

            $from = $customFromParsed ?? $customToParsed?->copy()->subDays(29)->startOfDay();
            $to = $customToParsed ?? $now;
        } else {
            $from = match ($period) {
                'today' => $now->copy()->startOfDay(),
                '7d' => $now->copy()->subDays(6)->startOfDay(),
                '30d' => $now->copy()->subDays(29)->startOfDay(),
                '90d' => $now->copy()->subDays(89)->startOfDay(),
                '180d' => $now->copy()->subDays(179)->startOfDay(),
                '12m' => $now->copy()->startOfMonth()->subMonths(11)->startOfMonth(),
                default => null, // 'all'
            };
            $to = $now;
        }

        if ($from === null) {
            $from = $now->copy()->startOfMonth()->subMonths(11)->startOfMonth();
        }
        $to = $to->max($from);

        $days = $from->copy()->startOfDay()->diffInDays($to->copy()->endOfDay()) + 1;

        $granularity = match (true) {
            $period === 'today' && $days <= 2 => 'hourly',
            $days <= 45 => 'daily',
            $days <= 240 => 'weekly',
            default => 'monthly',
        };

        $bucketCount = $this->bucketCount($from, $to, $granularity);

        // The period immediately preceding the current one, same span.
        $prevTo = $from->copy()->subDay()->endOfDay();
        $prevFrom = $from->copy()->subDays($days)->startOfDay();

        return [
            'period' => $period,
            'from' => $from,
            'to' => $to,
            'prev_from' => $prevFrom,
            'prev_to' => $prevTo,
            'granularity' => $granularity,
            'bucket_count' => $bucketCount,
            'days' => (int) $days,
        ];
    }

    private function granularityLabel(string $granularity): string
    {
        return match ($granularity) {
            'hourly' => 'ساعة',
            'daily' => 'يوم',
            'weekly' => 'أسبوع',
            default => 'شهر',
        };
    }

    private function bucketCount(Carbon $from, Carbon $to, string $granularity): int
    {
        $count = match ($granularity) {
            'hourly' => $from->copy()->startOfDay()->diffInHours($to->copy()->endOfDay()) + 1,
            'daily' => $from->copy()->startOfDay()->diffInDays($to->copy()->endOfDay()) + 1,
            'weekly' => $from->copy()->startOfWeek()->diffInWeeks($to->copy()->endOfWeek()) + 1,
            default => $from->copy()->startOfMonth()->diffInMonths($to->copy()->startOfMonth()) + 1,
        };

        return (int) max(1, $count);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Trends
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Build a bucketed series of numeric values within a window.
     *
     * @param  callable(Carbon, Carbon): int|float  $aggregate
     * @return array<int, array{label: string, value: float|int}>
     */
    private function trendSeries(callable $aggregate, Carbon $from, Carbon $to, string $granularity): array
    {
        $series = [];
        $cursor = $this->cursorStart($from, $granularity);
        $end = $to;

        while ($cursor->lte($end)) {
            [$bucketFrom, $bucketTo] = $this->bucketRange($cursor, $granularity);

            if ($bucketFrom->gt($to) && $granularity !== 'hourly') {
                break;
            }

            $value = $aggregate($bucketFrom, $bucketTo->min($end));

            $series[] = [
                'label' => $this->bucketLabel($cursor, $granularity),
                'value' => (float) $value,
            ];

            $this->advanceCursor($cursor, $granularity);
        }

        return $series;
    }

    /**
     * Build a pass-rate (% passed of submitted) bucketed series.
     *
     * @return array<int, array{label: string, value: float|int}>
     */
    private function trendPassRate(Builder $attemptsQuery, Carbon $from, Carbon $to, string $granularity): array
    {
        $series = [];
        $cursor = $this->cursorStart($from, $granularity);
        $end = $to;

        while ($cursor->lte($end)) {
            [$bucketFrom, $bucketTo] = $this->bucketRange($cursor, $granularity);
            $bucketEnd = $bucketTo->min($end);

            $submitted = (clone $attemptsQuery)
                ->where('submitted_at', '>=', $bucketFrom)
                ->where('submitted_at', '<=', $bucketEnd)
                ->count();
            $passed = (clone $attemptsQuery)
                ->where('passed', true)
                ->where('submitted_at', '>=', $bucketFrom)
                ->where('submitted_at', '<=', $bucketEnd)
                ->count();

            $series[] = [
                'label' => $this->bucketLabel($cursor, $granularity),
                'value' => $submitted > 0 ? round(($passed / $submitted) * 100, 1) : 0,
            ];

            $this->advanceCursor($cursor, $granularity);
        }

        return $series;
    }

    private function cursorStart(Carbon $from, string $granularity): Carbon
    {
        return match ($granularity) {
            'hourly' => $from->copy()->startOfDay()->startOfHour(),
            'daily' => $from->copy()->startOfDay(),
            'weekly' => $from->copy()->startOfWeek(),
            default => $from->copy()->startOfMonth(),
        };
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function bucketRange(Carbon $cursor, string $granularity): array
    {
        return match ($granularity) {
            'hourly' => [$cursor->copy()->startOfHour(), $cursor->copy()->endOfHour()],
            'daily' => [$cursor->copy()->startOfDay(), $cursor->copy()->endOfDay()],
            'weekly' => [$cursor->copy()->startOfWeek(), $cursor->copy()->endOfWeek()],
            default => [$cursor->copy()->startOfMonth(), $cursor->copy()->endOfMonth()],
        };
    }

    private function advanceCursor(Carbon $cursor, string $granularity): void
    {
        match ($granularity) {
            'hourly' => $cursor->addHour(),
            'daily' => $cursor->addDay(),
            'weekly' => $cursor->addWeek(),
            default => $cursor->addMonth(),
        };
    }

    private function bucketLabel(Carbon $cursor, string $granularity): string
    {
        return match ($granularity) {
            'hourly' => $cursor->format('g:00'),
            'daily' => $cursor->format('d/m'),
            'weekly' => 'أسبوع '.$cursor->format('d/m'),
            default => $this->arabicMonthLabel($cursor->month),
        };
    }

    private function arabicMonthLabel(int $month): string
    {
        $months = [
            1 => 'يناير', 2 => 'فبراير', 3 => 'مارس', 4 => 'أبريل',
            5 => 'مايو', 6 => 'يونيو', 7 => 'يوليو', 8 => 'أغسطس',
            9 => 'سبتمبر', 10 => 'أكتوبر', 11 => 'نوفمبر', 12 => 'ديسمبر',
        ];

        return $months[$month] ?? (string) $month;
    }

    private function averageScoreBetween(int $tenantId, ?Carbon $from, ?Carbon $to): float
    {
        $query = ExamAttempt::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'submitted')
            ->where('max_score', '>', 0)
            ->selectRaw('AVG(score / max_score * 100) as p');

        if ($from !== null) {
            $query->where('submitted_at', '>=', $from);
        }
        if ($to !== null) {
            $query->where('submitted_at', '<=', $to);
        }

        $average = $query->value('p');

        return $average ? round((float) $average, 1) : 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Breakdowns & activity
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @return array<int, array{
     *     exam_id: int,
     *     title: string,
     *     attempts_total: int,
     *     attempts_period: int,
     *     passed_period: int,
     *     pass_rate_period: float,
     *     avg_score_period: float,
     *     last_attempted_at: ?string,
     * }>
     */
    private function examPerformance(int $tenantId, ?Carbon $from, ?Carbon $to): array
    {
        $topExamIds = ExamAttempt::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'submitted')
            ->select('exam_id')
            ->selectRaw('count(*) as total')
            ->groupBy('exam_id')
            ->orderByDesc('total')
            ->limit(6)
            ->pluck('exam_id');

        if ($topExamIds->isEmpty()) {
            return [];
        }

        return $topExamIds->map(function (int $examId) use ($tenantId, $from, $to) {
            $exam = Exam::query()->withTrashed()->find($examId);

            $base = ExamAttempt::query()
                ->where('tenant_id', $tenantId)
                ->where('exam_id', $examId)
                ->where('status', 'submitted');

            $attemptsTotal = (clone $base)->count();
            $attemptsPeriod = (clone $base)
                ->when($from, fn (Builder $q): Builder => $q->where('submitted_at', '>=', $from))
                ->when($to, fn (Builder $q): Builder => $q->where('submitted_at', '<=', $to))
                ->count();
            $passedPeriod = (clone $base)
                ->where('passed', true)
                ->when($from, fn (Builder $q): Builder => $q->where('submitted_at', '>=', $from))
                ->when($to, fn (Builder $q): Builder => $q->where('submitted_at', '<=', $to))
                ->count();
            $avgScore = (clone $base)
                ->where('max_score', '>', 0)
                ->when($from, fn (Builder $q): Builder => $q->where('submitted_at', '>=', $from))
                ->when($to, fn (Builder $q): Builder => $q->where('submitted_at', '<=', $to))
                ->selectRaw('AVG(score / max_score * 100) as p')
                ->value('p');
            $lastAttempted = (clone $base)
                ->when($from, fn (Builder $q): Builder => $q->where('submitted_at', '>=', $from))
                ->when($to, fn (Builder $q): Builder => $q->where('submitted_at', '<=', $to))
                ->latest('submitted_at')
                ->value('submitted_at');

            return [
                'exam_id' => $examId,
                'title' => $exam?->title ?? 'اختبار محذوف',
                'attempts_total' => $attemptsTotal,
                'attempts_period' => $attemptsPeriod,
                'passed_period' => $passedPeriod,
                'pass_rate_period' => $attemptsPeriod > 0 ? round(($passedPeriod / $attemptsPeriod) * 100, 1) : 0,
                'avg_score_period' => $avgScore ? round((float) $avgScore, 1) : 0,
                'last_attempted_at' => $lastAttempted ? Carbon::parse($lastAttempted)->toISOString() : null,
            ];
        })->values()->all();
    }

    /**
     * @return array<int, array{id: string, type: string, title: string, description: string, timestamp: string}>
     */
    private function recentActivity(int $tenantId, ?Carbon $from, ?Carbon $to, int $limit): array
    {
        $events = collect();

        CourseEnrollment::query()
            ->where('tenant_id', $tenantId)
            ->with(['student.user', 'course'])
            ->when($from, fn (Builder $q): Builder => $q->where('created_at', '>=', $from))
            ->when($to, fn (Builder $q): Builder => $q->where('created_at', '<=', $to))
            ->latest('created_at')
            ->limit($limit * 2)
            ->get()
            ->each(function (CourseEnrollment $enrollment) use (&$events, $from, $to): void {
                $this->pushActivity($events, 'enrollment', 'enrollment-'.$enrollment->id, 'تسجيل جديد في دورة',
                    $enrollment->student?->user?->name.' — '.($enrollment->course?->title ?? 'دورة'),
                    $enrollment->created_at, $from, $to);
            });

        ExamAttempt::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'submitted')
            ->with('exam')
            ->when($from, fn (Builder $q): Builder => $q->where('submitted_at', '>=', $from))
            ->when($to, fn (Builder $q): Builder => $q->where('submitted_at', '<=', $to))
            ->latest('submitted_at')
            ->limit($limit * 2)
            ->get()
            ->each(function (ExamAttempt $attempt) use (&$events, $from, $to): void {
                $this->pushActivity($events, 'exam', 'attempt-'.$attempt->id,
                    $attempt->passed ? 'اجتياز اختبار' : 'محاولة اختبار',
                    ($attempt->exam?->title ?? 'اختبار').' — '.round((float) ($attempt->percentage ?? 0), 1).'%',
                    $attempt->submitted_at, $from, $to);
            });

        IssuedCertificate::query()
            ->where('tenant_id', $tenantId)
            ->with(['course'])
            ->when($from, fn (Builder $q): Builder => $q->where('issued_at', '>=', $from))
            ->when($to, fn (Builder $q): Builder => $q->where('issued_at', '<=', $to))
            ->latest('issued_at')
            ->limit($limit * 2)
            ->get()
            ->each(function (IssuedCertificate $certificate) use (&$events, $from, $to): void {
                $this->pushActivity($events, 'certificate', 'certificate-'.$certificate->id, 'إصدار شهادة',
                    'شهادة جديدة لدورة '.($certificate->course?->title ?? ''),
                    $certificate->issued_at, $from, $to);
            });

        WalletTransaction::query()
            ->where('tenant_id', $tenantId)
            ->where('type', 'debit')
            ->with('tenantUser.user')
            ->when($from, fn (Builder $q): Builder => $q->where('created_at', '>=', $from))
            ->when($to, fn (Builder $q): Builder => $q->where('created_at', '<=', $to))
            ->latest('created_at')
            ->limit($limit * 2)
            ->get()
            ->each(function (WalletTransaction $transaction) use (&$events, $from, $to): void {
                $this->pushActivity($events, 'payment', 'payment-'.$transaction->id, 'عملية شراء',
                    ($transaction->tenantUser?->user?->name ?? 'طالب').' — '.$transaction->description,
                    $transaction->created_at, $from, $to);
            });

        return $events
            ->sortByDesc('sort')
            ->take($limit)
            ->map(fn (array $event) => array_diff_key($event, ['sort' => true]))
            ->values()
            ->all();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, array<string, mixed>>  $events
     */
    private function pushActivity(
        \Illuminate\Support\Collection $events,
        string $type,
        string $id,
        string $title,
        string $description,
        ?Carbon $date,
        ?Carbon $from,
        ?Carbon $to,
    ): void {
        $events->push([
            'sort' => $date?->getTimestamp() ?? 0,
            'id' => $id,
            'type' => $type,
            'title' => $title,
            'description' => $description,
            'timestamp' => $date?->diffForHumans() ?? '',
        ]);
    }

    private function subscriptionProgress(array $subscription): float
    {
        $start = isset($subscription['starts_at']) ? Carbon::parse($subscription['starts_at']) : null;
        $end = isset($subscription['ends_at']) ? Carbon::parse($subscription['ends_at']) : null;

        if (! $start || ! $end || $end->lte($start)) {
            return 0;
        }

        $total = $start->diffInDays($end);
        if ($total <= 0) {
            return 0;
        }

        $elapsed = $start->diffInDays(now());

        return round(min(100, max(0, ($elapsed / $total) * 100)), 1);
    }
}