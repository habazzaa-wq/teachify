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
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class TeacherDashboardController extends Controller
{
    public function __construct(
        private readonly MediaLibraryAssetService $media,
    ) {
    }

    public function stats(): JsonResponse
    {
        $tenant = currentTenant();
        $tenantId = $tenant->id;
        $now = now();
        $monthStart = $now->copy()->startOfMonth();
        $todayStart = $now->copy()->startOfDay();

        // ── Students ──────────────────────────────────────────────────────────
        $studentQuery = fn () => TenantUser::query()
            ->where('tenant_id', $tenantId)
            ->whereHas('roles', fn ($q) => $q->where('slug', 'student'));

        $studentsTotal = (clone $studentQuery())->count();
        $studentsActive = (clone $studentQuery())->where('status', 'active')->count();
        $studentsNewMonth = (clone $studentQuery())->where('created_at', '>=', $monthStart)->count();
        $studentsMonthly = $this->monthlySeries(
            fn (Carbon $from, Carbon $to) => (clone $studentQuery())
                ->whereBetween('created_at', [$from, $to])
                ->count(),
        );
        $studentsTrend = $this->delta($studentsMonthly);

        // ── Courses ──────────────────────────────────────────────────────────
        $coursesQuery = fn () => Course::query()->where('tenant_id', $tenantId);
        $coursesTotal = (clone $coursesQuery())->count();
        $coursesPublished = (clone $coursesQuery())->where('status', 'published')->count();
        $coursesTrend = $this->delta(
            $this->monthlySeries(fn (Carbon $from, Carbon $to) => (clone $coursesQuery())
                ->whereBetween('created_at', [$from, $to])
                ->count()),
        );

        // ── Enrollments ───────────────────────────────────────────────────────
        $enrollmentsTotal = CourseEnrollment::query()->where('tenant_id', $tenantId)->count();
        $enrollmentsActive = CourseEnrollment::query()->where('tenant_id', $tenantId)->where('status', 'active')->count();
        $enrollmentsCompleted = CourseEnrollment::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->count();
        $enrollmentTrendData = $this->monthlySeries(
            fn (Carbon $from, Carbon $to) => CourseEnrollment::query()
                ->where('tenant_id', $tenantId)
                ->whereBetween('created_at', [$from, $to])
                ->count(),
        );
        $enrollmentsTrend = $this->delta($enrollmentTrendData);

        // ── Exams & attempts ──────────────────────────────────────────────────
        $examsTotal = Exam::query()->where('tenant_id', $tenantId)->count();
        $examsPublished = Exam::query()->where('tenant_id', $tenantId)->where('status', 'published')->count();
        $questionsTotal = Question::query()->where('tenant_id', $tenantId)->whereNull('deleted_at')->count();

        $attempts = ExamAttempt::query()->where('tenant_id', $tenantId);
        $attemptsTotal = (clone $attempts)->count();
        $attemptsSubmitted = (clone $attempts)->where('status', 'submitted')->count();
        $attemptsPassed = (clone $attempts)->where('passed', true)->count();
        $attemptsAverageScore = (clone $attempts)
            ->where('status', 'submitted')
            ->where('max_score', '>', 0)
            ->selectRaw('AVG(score / max_score * 100) as p')
            ->value('p');
        $attemptsTrendData = $this->monthlySeries(
            fn (Carbon $from, Carbon $to) => ExamAttempt::query()
                ->where('tenant_id', $tenantId)
                ->whereBetween('created_at', [$from, $to])
                ->count(),
        );
        $attemptsTrend = $this->delta($attemptsTrendData);

        $examTrendData = $this->monthlySeries(
            fn (Carbon $from, Carbon $to) => Exam::query()
                ->where('tenant_id', $tenantId)
                ->whereBetween('created_at', [$from, $to])
                ->count(),
        );

        // ── Revenue (course purchases via wallet debits) ──────────────────────
        $revenueTotal = (float) WalletTransaction::query()
            ->where('tenant_id', $tenantId)
            ->where('type', 'debit')
            ->sum('amount');
        $revenueMonth = (float) WalletTransaction::query()
            ->where('tenant_id', $tenantId)
            ->where('type', 'debit')
            ->where('created_at', '>=', $monthStart)
            ->sum('amount');
        $revenueToday = (float) WalletTransaction::query()
            ->where('tenant_id', $tenantId)
            ->where('type', 'debit')
            ->where('created_at', '>=', $todayStart)
            ->sum('amount');
        $revenueTrendData = $this->monthlySeries(
            fn (Carbon $from, Carbon $to) => WalletTransaction::query()
                ->where('tenant_id', $tenantId)
                ->where('type', 'debit')
                ->whereBetween('created_at', [$from, $to])
                ->sum('amount'),
        );
        $revenueTrend = $this->delta($revenueTrendData);

        // ── Certificates ──────────────────────────────────────────────────────
        $certificatesTotal = IssuedCertificate::query()->where('tenant_id', $tenantId)->count();
        $certificatesTrend = $this->delta(
            $this->monthlySeries(fn (Carbon $from, Carbon $to) => IssuedCertificate::query()
                ->where('tenant_id', $tenantId)
                ->whereBetween('created_at', [$from, $to])
                ->count()),
        );

        // ── Recharge codes ────────────────────────────────────────────────────
        $rechargeCodesTotal = RechargeCode::query()->where('tenant_id', $tenantId)->count();
        $rechargeCodesActive = RechargeCode::query()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->count();

        // ── Completion rate ───────────────────────────────────────────────────
        $completedLearners = CourseCompletion::query()->where('tenant_id', $tenantId)->count();
        $averageCompletionRate = $enrollmentsActive > 0
            ? round(($completedLearners / max($enrollmentsActive, 1)) * 100, 1)
            : 0;

        // ── Media / storage ───────────────────────────────────────────────────
        $storage = $this->media->storageUsage($tenant);
        $mediaTotal = MediaAsset::query()->where('tenant_id', $tenantId)->count();
        $mediaVideos = MediaAsset::query()->where('tenant_id', $tenantId)->where('type', 'video')->count();

        // ── Top courses ───────────────────────────────────────────────────────
        $topCourses = Course::query()
            ->where('courses.tenant_id', $tenantId)
            ->withCount(['enrollments' => fn ($q) => $q->where('status', 'active')])
            ->orderByDesc('enrollments_count')
            ->limit(5)
            ->get()
            ->map(function (Course $course) {
                $students = $course->enrollments_count;

                $completed = CourseCompletion::query()
                    ->where('tenant_id', $course->tenant_id)
                    ->where('course_id', $course->id)
                    ->count();

                $courseRevenue = (float) WalletTransaction::query()
                    ->where('tenant_id', $course->tenant_id)
                    ->where('type', 'debit')
                    ->where('description', 'like', '%'.$course->title.'%')
                    ->sum('amount');

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'slug' => $course->slug,
                    'students' => $students,
                    'completion_rate' => $students > 0 ? round(($completed / $students) * 100, 1) : 0,
                    'revenue' => $courseRevenue,
                    'status' => $course->status,
                    'thumbnail' => $course->thumbnail_path,
                ];
            })
            ->values();

        // ── Recent activity ───────────────────────────────────────────────────
        $recentActivity = $this->recentActivity($tenantId, 8);

        // ── Subscription ──────────────────────────────────────────────────────
        $subscription = $tenant->subscription ?? [];
        $plan = $tenant->plan ?? [];
        $subscriptionPeriodEnd = isset($subscription['ends_at']) ? Carbon::parse($subscription['ends_at']) : null;
        $subscriptionDaysLeft = (int) ($subscriptionPeriodEnd?->diffInDays($now, false) ?? 0);
        $trialDaysRemaining = (int) ($subscription['trial_days_remaining'] ?? 0);
        $subscriptionProgress = $this->subscriptionProgress($subscription);

        return response()->json([
            'stats' => [
                'students_total' => $studentsTotal,
                'students_active' => $studentsActive,
                'students_new_month' => $studentsNewMonth,
                'students_trend' => $studentsTrend,
                'courses_total' => $coursesTotal,
                'courses_published' => $coursesPublished,
                'courses_trend' => $coursesTrend,
                'exams_total' => $examsTotal,
                'exams_published' => $examsPublished,
                'exams_trend' => $this->delta($examTrendData),
                'questions_total' => $questionsTotal,
                'enrollments_total' => $enrollmentsTotal,
                'enrollments_active' => $enrollmentsActive,
                'enrollments_completed' => $enrollmentsCompleted,
                'enrollments_trend' => $enrollmentsTrend,
                'revenue_total' => round($revenueTotal, 2),
                'revenue_month' => round($revenueMonth, 2),
                'revenue_today' => round($revenueToday, 2),
                'revenue_trend' => $revenueTrend,
                'certificates_total' => $certificatesTotal,
                'certificates_trend' => $certificatesTrend,
                'attempts_total' => $attemptsTotal,
                'attempts_submitted' => $attemptsSubmitted,
                'attempts_passed' => $attemptsPassed,
                'attempts_pass_rate' => $attemptsSubmitted > 0 ? round(($attemptsPassed / $attemptsSubmitted) * 100, 1) : 0,
                'attempts_average_score' => $attemptsAverageScore ? round((float) $attemptsAverageScore, 1) : 0,
                'attempts_trend' => $attemptsTrend,
                'average_completion_rate' => $averageCompletionRate,
                'completed_learners' => $completedLearners,
                'recharge_codes_total' => $rechargeCodesTotal,
                'recharge_codes_active' => $rechargeCodesActive,
                'media_total' => $mediaTotal,
                'media_videos' => $mediaVideos,
                'storage' => $storage,
                'subscription' => [
                    'plan' => $plan['name'] ?? $tenant->subscription['plan'] ?? 'خطة أساسية',
                    'days_left' => max(0, $subscriptionDaysLeft),
                    'progress' => $subscriptionProgress,
                    'trial_days_remaining' => max(0, $trialDaysRemaining),
                    'status' => $tenant->status,
                ],
            ],
            'revenue_trend' => $revenueTrendData,
            'enrollment_trend' => $this->monthlySeriesLabels($enrollmentTrendData),
            'students_trend' => $this->monthlySeriesLabels($studentsMonthly),
            'exam_attempts_trend' => $this->monthlySeriesLabels($attemptsTrendData),
            'top_courses' => $topCourses,
            'recent_activity' => $recentActivity,
        ]);
    }

    /**
     * @return array<int, array{label: string, value: float|int}>
     */
    private function monthlySeries(callable $countForRange): array
    {
        $series = [];
        $now = now();
        $current = $now->copy()->startOfMonth()->subMonths(11);

        for ($i = 0; $i < 12; $i++) {
            $from = $current->copy()->startOfMonth();
            $to = $current->copy()->endOfMonth();
            $value = $countForRange($from, $to);
            $series[] = [
                'label' => $this->arabicMonthLabel($current->month),
                'value' => (float) $value,
            ];
            $current->addMonth();
        }

        return $series;
    }

    /**
     * @return array<int, float>
     */
    private function monthlySeriesValues(array $series): array
    {
        return array_column($series, 'value');
    }

    /**
     * @return array<int, array{label: string, value: float}>
     */
    private function monthlySeriesLabels(array $series): array
    {
        return array_map(fn (array $point) => [
            'label' => $point['label'],
            'value' => (float) $point['value'],
        ], $series);
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

    /**
     * Percent change between the last two values of a series.
     */
    private function delta(array $series): float
    {
        $values = $this->monthlySeriesValues($series);

        if (count($values) < 2) {
            return 0;
        }

        $previous = (float) $values[count($values) - 2];
        $current = (float) end($values);

        if ($previous <= 0) {
            return 0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    private function subscriptionProgress(array $subscription): float
    {
        $start = isset($subscription['starts_at']) ? Carbon::parse($subscription['starts_at']) : null;
        $end = isset($subscription['ends_at']) ? Carbon::parse($subscription['ends_at']) : null;

        if (! $start || ! $end || $end->lte($start)) {
            return 0;
        }

        $total = $start->diffInDays($end);
        $elapsed = $start->diffInDays(now());

        if ($total <= 0) {
            return 0;
        }

        return round(min(100, max(0, ($elapsed / $total) * 100)), 1);
    }

    /**
     * @return array<int, array{id: string, type: string, title: string, description: string, timestamp: string}>
     */
    private function recentActivity(int $tenantId, int $limit): array
    {
        $events = collect();

        CourseEnrollment::query()
            ->where('tenant_id', $tenantId)
            ->with(['student.user', 'course'])
            ->latest('created_at')
            ->limit($limit)
            ->get()
            ->each(function (CourseEnrollment $enrollment) use (&$events): void {
                $events->push([
                    'sort' => $enrollment->created_at?->getTimestamp() ?? 0,
                    'id' => 'enrollment-'.$enrollment->id,
                    'type' => 'enrollment',
                    'title' => 'تسجيل جديد في دورة',
                    'description' => $enrollment->student?->user?->name
                        .' — '.($enrollment->course?->title ?? 'دورة'),
                    'timestamp' => $enrollment->created_at?->diffForHumans() ?? '',
                ]);
            });

        ExamAttempt::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'submitted')
            ->with('exam')
            ->latest('submitted_at')
            ->limit($limit)
            ->get()
            ->each(function (ExamAttempt $attempt) use (&$events): void {
                $events->push([
                    'sort' => $attempt->submitted_at?->getTimestamp() ?? 0,
                    'id' => 'attempt-'.$attempt->id,
                    'type' => 'exam',
                    'title' => $attempt->passed ? 'اجتياز اختبار' : 'محاولة اختبار',
                    'description' => ($attempt->exam?->title ?? 'اختبار')
                        .' — '.round((float) ($attempt->percentage ?? 0), 1).'%',
                    'timestamp' => $attempt->submitted_at?->diffForHumans() ?? '',
                ]);
            });

        IssuedCertificate::query()
            ->where('tenant_id', $tenantId)
            ->with(['course'])
            ->latest('issued_at')
            ->limit($limit)
            ->get()
            ->each(function (IssuedCertificate $certificate) use (&$events): void {
                $events->push([
                    'sort' => $certificate->issued_at?->getTimestamp() ?? 0,
                    'id' => 'certificate-'.$certificate->id,
                    'type' => 'certificate',
                    'title' => 'إصدار شهادة',
                    'description' => 'شهادة جديدة لدورة '.($certificate->course?->title ?? ''),
                    'timestamp' => $certificate->issued_at?->diffForHumans() ?? '',
                ]);
            });

        WalletTransaction::query()
            ->where('tenant_id', $tenantId)
            ->where('type', 'debit')
            ->with('tenantUser.user')
            ->latest('created_at')
            ->limit($limit)
            ->get()
            ->each(function (WalletTransaction $transaction) use (&$events): void {
                $events->push([
                    'sort' => $transaction->created_at?->getTimestamp() ?? 0,
                    'id' => 'payment-'.$transaction->id,
                    'type' => 'payment',
                    'title' => 'عملية شراء',
                    'description' => ($transaction->tenantUser?->user?->name ?? 'طالب')
                        .' — '.$transaction->description,
                    'timestamp' => $transaction->created_at?->diffForHumans() ?? '',
                ]);
            });

        return $events
            ->sortByDesc('sort')
            ->take($limit)
            ->map(fn (array $event) => array_diff_key($event, ['sort' => true]))
            ->values()
            ->all();
    }
}