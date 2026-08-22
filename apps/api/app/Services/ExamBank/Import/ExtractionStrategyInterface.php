<?php

namespace App\Services\ExamBank\Import;

use App\Models\QuestionImport;

interface ExtractionStrategyInterface
{
    public function name(): string;
    public function available(): bool;
    public function unavailabilityReason(): ?string;
    public function extract(QuestionImport $import, ImportStageRecorder $recorder): array;
}
