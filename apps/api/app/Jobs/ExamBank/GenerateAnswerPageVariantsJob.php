<?php

namespace App\Jobs\ExamBank;

use App\Queue\Middleware\SetCorrelationContext;
use App\Queue\Middleware\SetTenantContext;
use App\Services\ExamBank\AnswerPageVariantService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Generates optimized + thumbnail variants for one confirmed exam answer page
 * (Phase F), off the HTTP confirm path.
 *
 * Follows the same queued-job shape as GradeExamAttemptJob
 * (app/Jobs/ExamBank/GradeExamAttemptJob.php):
 *  - carries a primitive tenant id (never a scoped model), because
 *    SetTenantContext binds the tenant before handle() runs and
 *    SerializesModels would otherwise touch scoped models with no context,
 *  - runs the SetTenantContext + SetCorrelationContext middleware pair,
 *  - resolves the target through withoutGlobalScopes() + an explicit
 *    tenant_id filter so failed()/retries stay isolated,
 *  - uses the same `database` queue connection configured everywhere
 *    (config/queue.php, QUEUE_CONNECTION=database) and no new queue name —
 *    it lands on the default queue like PushResumableToBunnyJob, so no worker
 *    change is required.
 *
 * Processing is best-effort and isolated: the dispatch site already tolerates
 * a worker failure (confirm keeps succeeding), the service is idempotent
 * (existing variant rows are never duplicated), and the Phase C read endpoint
 * always serves the original, so a missing variant is a graceful fallback.
 */
class GenerateAnswerPageVariantsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public int $tenantId,
        public int $assetId,
    ) {}

    /**
     * @return list<SetTenantContext>
     */
    public function middleware(): array
    {
        return [new SetTenantContext($this->tenantId), new SetCorrelationContext];
    }

    public function handle(AnswerPageVariantService $variants): void
    {
        $variants->generateForAsset($this->tenantId, $this->assetId);
    }

    public function failed(Throwable $exception): void
    {
        Log::error('exam-answer-page.variant_job_failed', [
            'tenant_id' => $this->tenantId,
            'asset_id' => $this->assetId,
            'error' => $exception->getMessage(),
        ]);
    }
}
