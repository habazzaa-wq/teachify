<?php

namespace App\Services\ExamBank\Import\Vision;

interface VisionQuestionExtractorInterface
{
    public function available(): bool;
    public function unavailabilityReason(): ?string;
    public function extract(string $imagePath, string $mime): array;
}
