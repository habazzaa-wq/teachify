<?php

namespace App\Jobs\ExamBank;

use App\Models\QuestionImport;
use App\Services\ExamBank\Import\ImportExtractionPipeline;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Processes one question import through the extraction pipeline on the queue
 * worker. The pipeline records live stage progress, so the processing UI only
 * ever reflects real work.
 */
class ProcessQuestionImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 300;

    public function __construct(
        public QuestionImport $import,
    ) {}

    public function handle(ImportExtractionPipeline $pipeline): void
    {
        $this->import->refresh();

        // Retry of a finished import must not clobber its terminal state.
        if (! $this->import->isPending() && ! $this->import->isProcessing()) {
            return;
        }

        $this->import->forceFill([
            'status' => QuestionImport::STATUS_PROCESSING,
            'attempts' => $this->import->attempts + 1,
            'processing_started_at' => now(),
        ])->save();

        $pipeline->run($this->import);
    }

    public function failed(Throwable $exception): void
    {
        Log::error('question-import.job_failed', [
            'import_id' => $this->import->id,
            'error' => $exception->getMessage(),
        ]);

        $this->import->forceFill([
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
