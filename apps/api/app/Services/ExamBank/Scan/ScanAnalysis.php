<?php

namespace App\Services\ExamBank\Scan;

final class ScanAnalysis
{
    public function __construct(
        public readonly int $width,
        public readonly int $height,
        public readonly float $brightnessMean,
        public readonly float $brightnessStd,
        public readonly int $p1,
        public readonly int $p2,
        public readonly int $p5,
        public readonly int $p50,
        public readonly int $p95,
        public readonly int $p99,
        public readonly int $paperLevel,
        public readonly float $saturationMean,
        public readonly float $castRG,
        public readonly float $castGB,
        public readonly float $sharpness,
        public readonly float $noise,
    ) {}

    public function isDark(): bool
    {
        return $this->brightnessMean < 165 || $this->paperLevel < 205;
    }

    public function isLowContrast(): bool
    {
        return ($this->paperLevel - $this->p2) < 90;
    }

    public function isSoft(): bool
    {
        return $this->sharpness < 260;
    }

    public function isNoisy(): bool
    {
        return $this->noise > 7;
    }
}
