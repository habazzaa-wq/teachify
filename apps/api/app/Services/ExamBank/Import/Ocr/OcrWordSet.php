<?php

namespace App\Services\ExamBank\Import\Ocr;

/**
 * A set of recognized words plus aggregate quality information.
 */
final class OcrWordSet
{
    /**
     * @param list<OcrWord> $words
     */
    public function __construct(
        public readonly array $words,
        public readonly float $meanConfidence,
        public readonly int $imageWidth,
        public readonly int $imageHeight,
    ) {}

    public function isEmpty(): bool
    {
        return $this->words === [];
    }
}
