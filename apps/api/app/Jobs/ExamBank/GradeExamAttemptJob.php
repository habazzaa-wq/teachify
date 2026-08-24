<?php

namespace App\Jobs\ExamBank;

use App\Models\ExamAttempt;
use App\Queue\Middleware\SetTenantContext;
use App\Services\ExamBank\ExamGradingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Grades a single exam attempt off the HTTP request path.
 *
 * Read paths (session/result lookups, autosave expiry) detect an expired
 * in-progress attempt and claim it by flipping status to "grading", then
 * dispatch this job so the expensive scoring never runs while a student is
 * waiting on a GET. Submit uses it only as a safety net; submit grades
 * inline after a short freeze so the response stays immediate.
 *
 * Idempotent by construction: ExamGradingService::grade() is a no-op unless
 * the attempt is still gradable ("in_progress" / "grading"), so retries,
 * manual retries or a duplicate dispatch can never double-score an attempt.
 *
 * The job carries a primitive tenant id (never a scoped model): SetTenantContext
 * binds the tenant before handle() runs, preserving tenant isolation for every
 * query the grader performs.
 */
class GradeExamAttemptJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    /**
     * Dedicated queue so exam grading never competes with imports/other jobs.
     */
    public function __construct(
        public int $tenantId,
        public int $attemptId,
    ) {
        $this->onQueue('grading');
    }

    /**
     * @return list<SetTenantContext>
     */
    public function middleware(): array
    {
        return [new SetTenantContext($this->tenantId)];
    }

    public function handle(ExamGradingService $grading): void
    {
        // Resolve without the tenant scope but enforce isolation explicitly,
        // because failed()/retries run outside the middleware chain.
        /** @var ExamAttempt|null $attempt */
        $attempt = ExamAttempt::withoutGlobalScopes()
            ->where('id', $this->attemptId)
            ->where('tenant_id', $this->tenantId)
            ->first();

        if ($attempt === null) {
            return;
        }

        // No-op unless still gradable — protects against duplicate dispatch /
        // retry double-grading.
        if (! in_array($attempt->status, ['in_progress', 'grading'], true)) {
            return;
        }

        $grading->grade($attempt);
    }

    public function failed(Throwable $exception): void
    {
        Log::error('exam-attempt.grading_job_failed', [
            'tenant_id' => $this->tenantId,
            'attempt_id' => $this->attemptId,
            'error' => $exception->getMessage(),
        ]);

        // Release a frozen ("grading") attempt back to "in_progress" so a
        // retry / student re-submit can recover it instead of leaving it stuck.
        ExamAttempt::withoutGlobalScopes()
            ->where('id', $this->attemptId)
            ->where('tenant_id', $this->tenantId)
            ->where('status', 'grading')
            ->update(['status' => 'in_progress']);
    }
}
