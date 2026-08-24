<?php

namespace App\Jobs\ExamBank;

use App\Models\QuestionImport;
use App\Queue\Middleware\SetTenantContext;
use App\Services\ExamBank\Import\ImportExtractionPipeline;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Processes one question import through the extraction pipeline on the queue
 * worker. The pipeline records live stage progress, so the processing UI only
 * ever reflects real work.
 *
 * The job carries primitive ids (tenant + import) instead of a scoped model:
 * SerializesModels restores queued models before job middleware runs, which
 * would hit TenantScope while no tenant context exists in the worker.
 * SetTenantContext binds the tenant first; handle() then resolves the import
 * through the normal (scoped) query, preserving tenant isolation.
 */
class ProcessQuestionImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    /**
     * Dedicated queue so OCR/Vision processing never blocks default jobs.
     * Set in the constructor because the Queueable trait owns the property.
     */
    public int $tries = 2;
    public int $timeout = 300;

    public function __construct(
        public int $tenantId,
        public int $importId,
    ) {
        $this->onQueue('imports');
    }

    /**
     * @return list<SetTenantContext>
     */
    public function middleware(): array
    {
        return [new SetTenantContext($this->tenantId)];
    }

    public function handle(ImportExtractionPipeline $pipeline): void
    {
        // Safe: SetTenantContext bound this job's tenant before handle ran,
        // so the global TenantScope resolves to the dispatching tenant.
        /** @var QuestionImport|null $import */
        $import = QuestionImport::query()->find($this->importId);

        if ($import === null) {
            return;
        }

        // Retry of a finished import must not clobber its terminal state.
        if (! $import->isPending() && ! $import->isProcessing()) {
            return;
        }

        $import->forceFill([
            'status' => QuestionImport::STATUS_PROCESSING,
            'attempts' => $import->attempts + 1,
            'processing_started_at' => now(),
        ])->save();

        $pipeline->run($import);
    }

    public function failed(Throwable $exception): void
    {
        Log::error('question-import.job_failed', [
            'tenant_id' => $this->tenantId,
            'import_id' => $this->importId,
            'error' => $exception->getMessage(),
        ]);

        // failed() runs outside the middleware chain (no tenant context), so
        // fetch by primary key directly and only ever write terminal state.
        $import = QuestionImport::withoutGlobalScopes()->find($this->importId);

        if ($import === null) {
            return;
        }

        $import->forceFill([
            'status' => QuestionImport::STATUS_FAILED,
            'error' => [
                'code' => 'worker_failed',
                'stage' => null,
                'message' => 'تعذرت معالجة الاستيراد على الخادم. أعد المحاولة.',
            ],
            'finished_at' => now(),
        ])->save();
    }
}
