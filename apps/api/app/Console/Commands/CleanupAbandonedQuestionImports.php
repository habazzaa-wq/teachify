<?php

namespace App\Console\Commands;

use App\Services\ExamBank\Import\QuestionImportService;
use Illuminate\Console\Command;

class CleanupAbandonedQuestionImports extends Command
{
    protected $signature = 'question-imports:cleanup {--days= : Override retention days}';

    protected $description = 'Reap abandoned question imports past retention and delete their source files';

    public function handle(QuestionImportService $service): int
    {
        if ($days = $this->option('days')) {
            config(['question-import.retention_days' => (int) $days]);
        }

        $deleted = $service->cleanupAbandoned();

        $this->info("Cleaned up {$deleted} abandoned question import(s).");

        return self::SUCCESS;
    }
}
