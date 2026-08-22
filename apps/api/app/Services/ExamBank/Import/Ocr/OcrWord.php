<?php

namespace App\Services\ExamBank\Import\Ocr;

/**
 * A word recognized by the OCR engine: text, geometry and confidence.
 */
final readonly class OcrWord
{
    public function __construct(
        public string $text,
        public float $x,
        public float $y,
        public float $width,
        public float $height,
        /** Engine confidence 0..100; null when unavailable for this word. */
        public ?float $confidence = null,
        public int $lineNumber = 0,
    ) {}

    public function x2(): float
    {
        return $this->x + $this->width;
    }

    public function y2(): float
    {
        return $this->y + $this->height;
    }
}
