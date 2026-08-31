<?php

namespace App\Services\ExamBank\Scan;

final class ScanResult
{
    /**
     * @param list<array{key: string, label: string, status: string, detail?: string}> $stages
     * @param array{brightness: float, saturation: float, sharpness: float, level: string} $quality
     */
    public function __construct(
        public readonly string $bytes,
        public readonly int $width,
        public readonly int $height,
        public readonly string $mode,
        public readonly array $stages,
        public readonly array $quality,
        public readonly string $mimeType = 'image/jpeg',
        public readonly string $extension = 'jpg',
        public readonly bool $fallbackUsed = false,
        public readonly ?string $fallbackReason = null,
        public readonly bool $documentDetected = false,
        public readonly bool $perspectiveCorrected = false,
        public readonly bool $deskewed = false,
        public readonly bool $enhanced = false,
        public readonly bool $originalPreserved = false,
    ) {}
}
