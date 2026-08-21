<?php

namespace App\Services\ExamBank\Scan;

use InvalidArgumentException;

final class DocumentScanProcessor
{
    private const MODE_AUTO = 'auto';
    private const MODE_COLOR = 'color_document';
    private const MODE_GRAY = 'grayscale_document';
    private const MODE_PRESERVE = 'original_preserve';

    private readonly int $maxDimension;
    private readonly int $jpegQuality;
    private readonly int $minOutputDimension;
    private readonly int $analysisSample;
    private readonly int $detectionSample;
    private readonly float $confidenceThreshold;
    private readonly float $fullFrameRatio;

    /** @var list<array{key: string, label: string, status: string, detail?: string}> */
    private array $stages = [];

    /** @var callable|null */
    private $stageObserver;

    public function __construct()
    {
        $this->maxDimension = max(1200, (int) config('scanner.max_dimension', 3200));
        $this->jpegQuality = min(95, max(88, (int) config('scanner.jpeg_quality', 92)));
        $this->minOutputDimension = (int) config('scanner.min_output_dimension', 250);
        $this->analysisSample = (int) config('scanner.analysis_sample_size', 512);
        $this->detectionSample = (int) config('scanner.detection_sample_size', 480);
        $this->confidenceThreshold = (float) config('scanner.perspective_confidence_threshold', 0.72);
        $this->fullFrameRatio = (float) config('scanner.full_frame_area_ratio', 0.93);
    }

    public function jpegQuality(): int
    {
        return $this->jpegQuality;
    }

    /**
     * Optional debug hook: receives (string $stage, GdImage|null $image, array $meta)
     * after each real transformation. No-op in production usage.
     */
    public function withStageObserver(?callable $observer): self
    {
        $this->stageObserver = $observer;

        return $this;
    }

    private function observe(string $stage, ?\GdImage $image, array $meta = []): void
    {
        if ($this->stageObserver !== null) {
            ($this->stageObserver)($stage, $image, $meta);
        }
    }

    public function process(string $bytes, string $mode = self::MODE_AUTO, ?int $exifOrientation = null): ScanResult
    {
        $this->stages = [];
        $mode = in_array($mode, [self::MODE_AUTO, self::MODE_COLOR, self::MODE_GRAY, self::MODE_PRESERVE], true)
            ? $mode
            : self::MODE_AUTO;

        try {
            return $this->runPipeline($bytes, $mode, $exifOrientation);
        } catch (\Throwable $e) {
            report($e);
            return $this->safeFallback($bytes, $mode, $exifOrientation, $e->getMessage());
        }
    }

    private function runPipeline(string $bytes, string $mode, ?int $exifOrientation): ScanResult
    {
        $oriented = $this->decodeAndOrient($bytes, $exifOrientation);
        $this->observe('oriented', $oriented, ['exifOrientation' => $exifOrientation]);

        $snapshot = $this->snapshotReference($oriented);

        $work = $this->resizeWithinBounds($oriented);
        if ($work !== $oriented) {
            $oriented = null;
            $this->record('resize', 'ضبط أبعاد الصورة', 'done', imagesx($work) . '×' . imagesy($work));
        }
        $this->observe('resized', $work, ['width' => imagesx($work), 'height' => imagesy($work)]);

        $analysis = $this->analyze($work);
        $this->record('analyze', 'تحليل الصورة', 'done', $this->analysisDetail($analysis));

        $warped = false;
        $deskewed = false;
        $detected = false;

        if ($mode !== self::MODE_PRESERVE) {
            $quad = $this->detectDocumentQuad($work);

            if ($quad !== null && $quad['confidence'] >= $this->confidenceThreshold) {
                $detected = true;

                if ($quad['areaRatio'] >= $this->fullFrameRatio) {
                    $this->record('perspective', 'تصحيح منظور الصفحة', 'skipped', 'الصفحة تملأ الإطار بالكامل');
                    $angle = $quad['angle'];
                    if (abs($angle) >= 0.8 && abs($angle) <= 15.0) {
                        $deskewResult = $this->rotateAndTrim($work, $angle);
                        if ($deskewResult !== null) {
                            $work = $deskewResult;
                            $deskewed = true;
                            $this->record('deskew', 'تسوية ميل الصفحة', 'done', sprintf('%+.1f°', $angle));
                        } else {
                            $this->record('deskew', 'تسوية ميل الصفحة', 'skipped', 'التسوية قد تفقد محتوى');
                        }
                    }
                } else {
                    $warpedResult = $this->warpToQuad($work, $quad['corners']);
                    if ($warpedResult !== null) {
                        if (max(imagesx($warpedResult), imagesy($warpedResult)) < 900) {
                            imagedestroy($warpedResult);
                            $this->record('perspective', 'تصحيح منظور الصفحة', 'skipped', 'حدود غير موثوقة');
                        } else {
                            imagedestroy($work);
                            $work = $warpedResult;
                            $warped = true;
                            $this->record('perspective', 'تصحيح منظور الصفحة', 'done', sprintf('ثقة %d%%', (int) round($quad['confidence'] * 100)));
                        }
                    } else {
                        $this->record('perspective', 'تصحيح منظور الصفحة', 'skipped', 'تحويل غير آمن');
                    }
                }
            } else {
                $this->record(
                    'perspective',
                    'اكتشاف حدود المستند',
                    'skipped',
                    $quad === null ? 'لم تُكتشف حدود موثوقة' : sprintf('ثقة منخفضة (%d%%)', (int) round(($quad['confidence'] ?? 0) * 100)),
                );

                if ($quad === null) {
                    $angle = $this->estimateSkewByProjection($work);
                    if ($angle !== null) {
                        $deskewResult = $this->rotateAndTrim($work, $angle);
                        if ($deskewResult !== null) {
                            $work = $deskewResult;
                            $deskewed = true;
                            $this->record('deskew', 'تسوية ميل النص', 'done', sprintf('%+.1f°', $angle));
                        }
                    }
                }
            }
        } else {
            $this->record('perspective', 'وضع الحفظ الأصلي', 'skipped', 'بدون معالجة هندسية');
        }
        $this->observe('after_geometry', $work, ['detected' => $detected, 'warped' => $warped, 'deskewed' => $deskewed]);

        $enhanced = false;
        $sharpened = false;
        $preToneImage = null;

        if ($mode !== self::MODE_PRESERVE) {
            $toneResult = $this->applyToneCorrection($work, $analysis, $mode);
            if ($toneResult !== null) {
                $preToneImage = $work;
                $work = $toneResult;
                $enhanced = true;
                $this->record('enhance', 'تحسين وضوح المستند', 'done', $mode === self::MODE_GRAY ? 'تطبيع التباين (تدرج رمادي)' : 'تطبيع الإضاءة والتباين');
            } else {
                $this->record('enhance', 'تحسين وضوح المستند', 'skipped', 'الصورة واضحة أصلاً — تم تخطي التحسين');
            }

            $postAnalysis = $enhanced ? $this->analyze($work) : $analysis;
            if ($this->shouldSharpen($postAnalysis, $mode)) {
                $sharpenedWork = $this->convolutionSharpen($work, $mode === self::MODE_GRAY ? 0.28 : 0.2);
                if ($sharpenedWork !== null) {
                    imagedestroy($work);
                    $work = $sharpenedWork;
                    $sharpened = true;
                }
            }
        } else {
            $this->record('enhance', 'تحسين وضوح المستند', 'skipped', 'وضع الحفظ الأصلي');
        }
        $this->observe('after_tone_sharpen', $work, ['enhanced' => $enhanced, 'sharpened' => $sharpened]);

        $validation = $this->validateCandidate($work, $snapshot, $warped || $deskewed, $enhanced);

        if (! $validation['ok'] && $enhanced && ! $warped && ! $deskewed && $preToneImage !== null) {
            imagedestroy($work);
            $work = $this->applyGentleTone($preToneImage, $analysis);
            $preToneImage = null;
            $sharpened = false;
            $this->record('enhance', 'تحسين وضوح المستند', 'done', 'تحسين إضاءة خفيف يحافظ على الألوان');
            $validation = $this->validateCandidate($work, $snapshot, false, true);
        }

        if (! $validation['ok']) {
            imagedestroy($work);
            return $this->safeFallbackFromImage($oriented, $bytes, $mode, $exifOrientation, 'فشل فحص الجودة: ' . $validation['reason']);
        }
        $this->record('validate', 'التحقق من الجودة', 'done');
        $this->observe('validated', $work);

        if ($preToneImage !== null) {
            imagedestroy($preToneImage);
        }

        $encoded = $this->encodeJpeg($work);
        imagedestroy($work);
        imagedestroy($oriented);
        $this->observe('encoded', null, ['bytes' => strlen($encoded)]);

        $finalAnalysis = $this->analyzeFromBytes($encoded);
        $qualityLevel = $this->qualityLevel($enhanced || $sharpened || $warped || $deskewed, $mode);

        $this->record('encode', 'ترميز الصورة النهائية', 'done', sprintf('JPEG q%d', $this->jpegQuality));

        return new ScanResult(
            bytes: $encoded,
            width: $finalAnalysis->width,
            height: $finalAnalysis->height,
            mode: $mode,
            stages: $this->stages,
            quality: [
                'brightness' => round($finalAnalysis->brightnessMean, 1),
                'saturation' => round($finalAnalysis->saturationMean * 100, 1),
                'sharpness' => round($finalAnalysis->sharpness),
                'level' => $qualityLevel,
            ],
            documentDetected: $detected,
            perspectiveCorrected: $warped,
            deskewed: $deskewed,
            enhanced: $enhanced || $sharpened,
        );
    }

    // ════════════════════════════════════════════════════════════
    //  Decode / Orient / Resize
    // ════════════════════════════════════════════════════════════

    private function decodeAndOrient(string $bytes, ?int $exifOrientation): \GdImage
    {
        $src = @imagecreatefromstring($bytes);
        if ($src === false) {
            throw new InvalidArgumentException('Unable to decode image.');
        }

        if (! imageistruecolor($src)) {
            $truecolor = imagecreatetruecolor(imagesx($src), imagesy($src));
            imagecopy($truecolor, $src, 0, 0, 0, 0, imagesx($src), imagesy($src));
            imagedestroy($src);
            $src = $truecolor;
        }

        if ($this->hasMeaningfulAlpha($src)) {
            $flat = imagecreatetruecolor(imagesx($src), imagesy($src));
            imagealphablending($flat, true);
            imagefill($flat, 0, 0, imagecolorallocate($flat, 255, 255, 255));
            imagecopy($flat, $src, 0, 0, 0, 0, imagesx($src), imagesy($src));
            imagedestroy($src);
            $src = $flat;
        }

        if ($exifOrientation !== null && in_array($exifOrientation, [3, 6, 8], true)) {
            $degrees = match ($exifOrientation) {
                3 => 180,
                6 => 270,
                8 => 90,
            };
            $rotated = imagerotate($src, $degrees, 16777215);
            if ($rotated !== false) {
                imagedestroy($src);
                $src = $rotated;
            }
        }

        return $src;
    }

    private function hasMeaningfulAlpha(\GdImage $img): bool
    {
        $w = imagesx($img);
        $h = imagesy($img);
        $step = max(1, (int) floor(min($w, $h) / 128));
        for ($y = 0; $y < $h; $y += $step) {
            for ($x = 0; $x < $w; $x += $step) {
                $rgba = imagecolorat($img, $x, $y);
                if ((($rgba >> 24) & 0x7F) > 8) {
                    return true;
                }
            }
        }
        return false;
    }

    private function resizeWithinBounds(\GdImage $image): \GdImage
    {
        $w = imagesx($image);
        $h = imagesy($image);

        if ($w <= $this->maxDimension && $h <= $this->maxDimension) {
            return $image;
        }

        $scale = min($w, $h) > 0 ? $this->maxDimension / max($w, $h) : 1.0;
        $newW = max(1, (int) round($w * $scale));
        $newH = max(1, (int) round($h * $scale));

        $resized = imagecreatetruecolor($newW, $newH);
        imagefill($resized, 0, 0, imagecolorallocate($resized, 255, 255, 255));
        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newW, $newH, $w, $h);
        imagedestroy($image);

        return $resized;
    }

    // ════════════════════════════════════════════════════════════
    //  Analysis
    // ════════════════════════════════════════════════════════════

    private function analyze(\GdImage $image): ScanAnalysis
    {
        [$lum, $meta] = $this->sampleLuminance($image, $this->analysisSample);

        sort($lum);
        $n = count($lum);
        $p = fn(float $q): int => (int) $lum[min($n - 1, (int) floor($q * $n))];

        $hist = array_fill(0, 256, 0);
        foreach ($meta['hist'] as $v => $c) {
            $hist[$v] = $c;
        }

        $paperLevel = $this->estimatePaperLevel($hist, $n, $p(0.95));

        return new ScanAnalysis(
            width: imagesx($image),
            height: imagesy($image),
            brightnessMean: $meta['mean'],
            brightnessStd: sqrt(max(0, $meta['mean2'] - $meta['mean'] ** 2)),
            p1: $p(0.01),
            p2: $p(0.02),
            p5: $p(0.05),
            p50: $p(0.50),
            p95: $p(0.95),
            p99: $p(0.99),
            paperLevel: $paperLevel,
            saturationMean: $meta['sat'],
            castRG: $meta['castRG'],
            castGB: $meta['castGB'],
            sharpness: $meta['lapVar'],
            noise: $meta['noise'],
        );
    }

    /** @return array{0: list<int>, 1: array<string, float|array>} */
    private function sampleLuminance(\GdImage $image, int $sampleSize): array
    {
        $w = imagesx($image);
        $h = imagesy($image);
        $step = max(1, (int) floor(max($w, $h) / $sampleSize));

        $lum = [];
        $hist = array_fill(0, 256, 0);
        $sumL = $sumL2 = $sumSat = $sumRG = $sumGB = 0.0;
        $laps = [];
        $count = 0;

        for ($y = 0; $y < $h; $y += $step) {
            for ($x = 0; $x < $w; $x += $step) {
                $rgb = imagecolorat($image, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;
                $l = 0.299 * $r + 0.587 * $g + 0.114 * $b;
                $li = (int) $l;
                $lum[] = $li;
                $hist[$li]++;
                $mx = max($r, $g, $b);
                $mn = min($r, $g, $b);
                $sumSat += $mx == 0 ? 0 : ($mx - $mn) / $mx;
                $sumRG += $r - $g;
                $sumGB += $g - $b;
                $sumL += $l;
                $sumL2 += $l * $l;
                $count++;

                if ($x > 0 && $y > 0 && $x < $w - $step && $y < $h - $step) {
                    $lC = $l;
                    $lL = $this->lumAt($image, $x - $step, $y);
                    $lR = $this->lumAt($image, $x + $step, $y);
                    $lU = $this->lumAt($image, $x, $y - $step);
                    $lD = $this->lumAt($image, $x, $y + $step);
                    $lap = 4 * $lC - $lL - $lR - $lU - $lD;
                    $laps[] = abs($lap);
                }
            }
        }

        $count = max(1, $count);
        $lapN = count($laps);
        $lapMean = $lapN > 0 ? array_sum($laps) / $lapN : 0.0;
        $lapVar = 0.0;
        foreach ($laps as $v) {
            $lapVar += ($v - $lapMean) ** 2;
        }
        $lapVar = $lapN > 0 ? $lapVar / $lapN : 0.0;

        sort($laps);
        $noise = $lapN > 0 ? $laps[(int) floor($lapN / 2)] : 0.0;

        return [
            $lum,
            [
                'hist' => $hist,
                'mean' => $sumL / $count,
                'mean2' => $sumL2 / $count,
                'sat' => $sumSat / $count,
                'castRG' => $sumRG / $count,
                'castGB' => $sumGB / $count,
                'lapVar' => $lapVar,
                'noise' => $noise,
            ],
        ];
    }

    private function lumAt(\GdImage $image, int $x, int $y): float
    {
        $rgb = imagecolorat($image, $x, $y);
        return 0.299 * (($rgb >> 16) & 0xFF) + 0.587 * (($rgb >> 8) & 0xFF) + 0.114 * ($rgb & 0xFF);
    }

    /** @param array<int, int> $hist */
    private function estimatePaperLevel(array $hist, int $total, int $fallbackP95): int
    {
        $bestBin = -1;
        $bestCount = 0;
        $rangeTotal = 0;
        for ($i = 140; $i <= 255; $i++) {
            $rangeTotal += $hist[$i];
            if ($hist[$i] > $bestCount) {
                $bestCount = $hist[$i];
                $bestBin = $i;
            }
        }

        if ($bestBin >= 0 && $rangeTotal > $total * 0.08) {
            return $bestBin;
        }

        return $fallbackP95;
    }

    private function analysisDetail(ScanAnalysis $a): string
    {
        return sprintf('سطوع %d، ورق %d، تباين %.0f', (int) $a->brightnessMean, $a->paperLevel, $a->brightnessStd);
    }

    // ════════════════════════════════════════════════════════════
    //  Document Detection
    // ════════════════════════════════════════════════════════════

    /**
     * @return null|array{corners: list<array{x: float, y: float}>, confidence: float, areaRatio: float, angle: float}
     */
    private function detectDocumentQuad(\GdImage $image): ?array
    {
        $origW = imagesx($image);
        $origH = imagesy($image);

        if ($origW < 60 || $origH < 60) {
            return null;
        }

        $scale = min(1.0, $this->detectionSample / max($origW, $origH));
        $smallW = max(8, (int) round($origW * $scale));
        $smallH = max(8, (int) round($origH * $scale));

        $small = imagecreatetruecolor($smallW, $smallH);
        imagecopyresampled($small, $image, 0, 0, 0, 0, $smallW, $smallH, $origW, $origH);

        $edgeGrid = $this->buildEdgeGrid($small, $smallW, $smallH);
        imagedestroy($small);

        $points = [];
        for ($y = 0; $y < $smallH; $y++) {
            for ($x = 0; $x < $smallW; $x++) {
                if ($edgeGrid[$y][$x]) {
                    $points[] = ['x' => $x, 'y' => $y];
                }
            }
        }

        if (count($points) < 30) {
            return null;
        }

        $hull = $this->convexHull($points);
        if (count($hull) < 4) {
            return null;
        }

        $rect = $this->minBoundingRect($hull);
        if ($rect === null) {
            return null;
        }

        $rectArea = $this->polygonArea($rect);
        $frameArea = $smallW * $smallH;
        $areaRatio = $rectArea / $frameArea;

        if ($areaRatio < 0.30) {
            return null;
        }

        $hullArea = $this->polygonArea($hull);
        $rectangularity = $rectArea > 0 ? $hullArea / $rectArea : 0.0;
        if ($rectangularity < 0.70 || $rectangularity > 1.12) {
            return null;
        }

        [$sideA, $sideB] = $this->rectSides($rect);
        $longSide = max($sideA, $sideB);
        $shortSide = min($sideA, $sideB);
        if ($shortSide < 1) {
            return null;
        }
        $aspect = $longSide / $shortSide;
        if ($aspect < 0.45 || $aspect > 2.75) {
            return null;
        }

        $supports = $this->edgeSupport($rect, $edgeGrid, $smallW, $smallH);
        $avgSupport = array_sum($supports) / 4.0;
        $minSupport = min($supports);

        if ($avgSupport < 0.35 || $minSupport < 0.15) {
            return null;
        }

        $areaScore = min(1.0, $areaRatio / 0.85);
        $rectScore = min(1.0, max(0.0, ($rectangularity - 0.70) / 0.28));
        $confidence = 0.40 * $avgSupport + 0.25 * $minSupport + 0.20 * $rectScore + 0.15 * $areaScore;

        $ordered = $this->orderQuad($rect);
        $angle = $this->quadAngle($ordered);

        $invScale = 1.0 / $scale;
        $corners = array_map(fn($pt) => [
            'x' => $pt['x'] * $invScale,
            'y' => $pt['y'] * $invScale,
        ], $ordered);

        return [
            'corners' => $corners,
            'confidence' => $confidence,
            'areaRatio' => $areaRatio,
            'angle' => $angle,
        ];
    }

    /** @return array<array<bool>> */
    private function buildEdgeGrid(\GdImage $img, int $w, int $h): array
    {
        $gray = [];
        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $rgb = imagecolorat($img, $x, $y);
                $gray[$y][$x] = (int) (0.299 * (($rgb >> 16) & 0xFF) + 0.587 * (($rgb >> 8) & 0xFF) + 0.114 * ($rgb & 0xFF));
            }
        }

        $blurred = [];
        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $sum = 0;
                for ($ky = -1; $ky <= 1; $ky++) {
                    for ($kx = -1; $kx <= 1; $kx++) {
                        $px = min($w - 1, max(0, $x + $kx));
                        $py = min($h - 1, max(0, $y + $ky));
                        $sum += $gray[$py][$px] * [1, 2, 1][$ky + 1] * [1, 2, 1][$kx + 1];
                    }
                }
                $blurred[$y][$x] = (int) ($sum / 16);
            }
        }

        $grid = array_fill(0, $h, array_fill(0, $w, false));
        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $gx = 0;
                $gy = 0;
                for ($ky = -1; $ky <= 1; $ky++) {
                    for ($kx = -1; $kx <= 1; $kx++) {
                        $px = min($w - 1, max(0, $x + $kx));
                        $py = min($h - 1, max(0, $y + $ky));
                        $val = $blurred[$py][$px];
                        $gx += $val * [-1, 0, 1, -2, 0, 2, -1, 0, 1][($ky + 1) * 3 + ($kx + 1)];
                        $gy += $val * [-1, -2, -1, 0, 0, 0, 1, 2, 1][($ky + 1) * 3 + ($kx + 1)];
                    }
                }
                if (sqrt($gx * $gx + $gy * $gy) > 40) {
                    $grid[$y][$x] = true;
                }
            }
        }

        return $grid;
    }

    /** @param list<array{x: int, y: int}> $points @return list<array{x: int, y: int}> */
    private function convexHull(array $points): array
    {
        usort($points, fn($a, $b) => $a['x'] <=> $b['x'] ?: $a['y'] <=> $b['y']);

        $cross = fn($o, $a, $b): float =>
            ($a['x'] - $o['x']) * ($b['y'] - $o['y']) - ($a['y'] - $o['y']) * ($b['x'] - $o['x']);

        $lower = [];
        foreach ($points as $p) {
            while (count($lower) >= 2 && $cross($lower[count($lower) - 2], $lower[count($lower) - 1], $p) <= 0) {
                array_pop($lower);
            }
            $lower[] = $p;
        }

        $upper = [];
        for ($i = count($points) - 1; $i >= 0; $i--) {
            $p = $points[$i];
            while (count($upper) >= 2 && $cross($upper[count($upper) - 2], $upper[count($upper) - 1], $p) <= 0) {
                array_pop($upper);
            }
            $upper[] = $p;
        }

        array_pop($lower);
        array_pop($upper);

        return array_merge($lower, $upper);
    }

    /**
     * @param list<array{x: float|int, y: float|int}> $hull
     * @return list<array{x: float, y: float}>|null
     */
    private function minBoundingRect(array $hull): ?array
    {
        $n = count($hull);
        if ($n < 3) {
            return null;
        }

        $minArea = PHP_FLOAT_MAX;
        $bestRect = null;

        for ($i = 0; $i < $n; $i++) {
            $j = ($i + 1) % $n;
            $edgeX = $hull[$j]['x'] - $hull[$i]['x'];
            $edgeY = $hull[$j]['y'] - $hull[$i]['y'];
            $edgeLen = hypot($edgeX, $edgeY);

            if ($edgeLen < 0.001) {
                continue;
            }

            $cos = $edgeX / $edgeLen;
            $sin = $edgeY / $edgeLen;

            $minU = $minV = PHP_FLOAT_MAX;
            $maxU = $maxV = PHP_FLOAT_MIN;

            foreach ($hull as $pt) {
                $u = $pt['x'] * $cos + $pt['y'] * $sin;
                $v = -$pt['x'] * $sin + $pt['y'] * $cos;
                $minU = min($minU, $u);
                $maxU = max($maxU, $u);
                $minV = min($minV, $v);
                $maxV = max($maxV, $v);
            }

            $area = ($maxU - $minU) * ($maxV - $minV);
            if ($area < $minArea && $area > 0) {
                $minArea = $area;
                $bestRect = [
                    ['x' => $minU * $cos - $minV * $sin, 'y' => $minU * $sin + $minV * $cos],
                    ['x' => $maxU * $cos - $minV * $sin, 'y' => $maxU * $sin + $minV * $cos],
                    ['x' => $maxU * $cos - $maxV * $sin, 'y' => $maxU * $sin + $maxV * $cos],
                    ['x' => $minU * $cos - $maxV * $sin, 'y' => $minU * $sin + $maxV * $cos],
                ];
            }
        }

        return $bestRect;
    }

    /** @param list<array{x: float|int, y: float|int}> $poly */
    private function polygonArea(array $poly): float
    {
        $n = count($poly);
        $area = 0.0;
        for ($i = 0; $i < $n; $i++) {
            $j = ($i + 1) % $n;
            $area += $poly[$i]['x'] * $poly[$j]['y'];
            $area -= $poly[$j]['x'] * $poly[$i]['y'];
        }
        return abs($area) / 2.0;
    }

    /** @return array{0: float, 1: float} */
    private function rectSides(array $rect): array
    {
        $sides = [];
        $n = count($rect);
        for ($i = 0; $i < $n; $i++) {
            $j = ($i + 1) % $n;
            $sides[] = hypot($rect[$j]['x'] - $rect[$i]['x'], $rect[$j]['y'] - $rect[$i]['y']);
        }
        sort($sides);
        return [$sides[0], $sides[3]];
    }

    /**
     * @param list<array{x: float, y: float}> $rect
     * @return array{0: float, 1: float, 2: float, 3: float} supports for sides 0-1, 1-2, 2-3, 3-0
     */
    private function edgeSupport(array $rect, array $edgeGrid, int $gridW, int $gridH): array
    {
        $supports = [];
        $n = count($rect);
        $samplesPerSide = 24;
        $radius = 3;

        for ($i = 0; $i < $n; $i++) {
            $a = $rect[$i];
            $b = $rect[($i + 1) % $n];
            $hit = 0;

            for ($s = 0; $s < $samplesPerSide; $s++) {
                $t = ($s + 0.5) / $samplesPerSide;
                $px = (int) round($a['x'] + ($b['x'] - $a['x']) * $t);
                $py = (int) round($a['y'] + ($b['y'] - $a['y']) * $t);

                $found = false;
                for ($dy = -$radius; $dy <= $radius && ! $found; $dy++) {
                    for ($dx = -$radius; $dx <= $radius && ! $found; $dx++) {
                        $qx = $px + $dx;
                        $qy = $py + $dy;
                        if ($qx >= 0 && $qy >= 0 && $qx < $gridW && $qy < $gridH && $edgeGrid[$qy][$qx]) {
                            $found = true;
                        }
                    }
                }
                if ($found) {
                    $hit++;
                }
            }

            $supports[] = $hit / $samplesPerSide;
        }

        return $supports;
    }

    /**
     * @param list<array{x: float, y: float}> $rect
     * @return list<array{x: float, y: float}> ordered TL, TR, BR, BL
     */
    private function orderQuad(array $rect): array
    {
        $cx = array_sum(array_column($rect, 'x')) / 4;
        $cy = array_sum(array_column($rect, 'y')) / 4;

        usort($rect, function ($a, $b) use ($cx, $cy) {
            $angleA = atan2($a['y'] - $cy, $a['x'] - $cx);
            $angleB = atan2($b['y'] - $cy, $b['x'] - $cx);
            return $angleA <=> $angleB;
        });

        $start = 0;
        $best = PHP_FLOAT_MAX;
        foreach ($rect as $i => $pt) {
            $score = $pt['x'] + $pt['y'];
            if ($score < $best) {
                $best = $score;
                $start = $i;
            }
        }

        $rotated = array_values(array_merge(
            array_slice($rect, $start),
            array_slice($rect, 0, $start),
        ));

        return [$rotated[0], $rotated[1], $rotated[2], $rotated[3]];
    }

    /** @param list<array{x: float, y: float}> $ordered TL,TR,BR,BL — degrees, positive = clockwise tilt */
    private function quadAngle(array $ordered): float
    {
        $topDx = $ordered[1]['x'] - $ordered[0]['x'];
        $topDy = $ordered[1]['y'] - $ordered[0]['y'];
        $botDx = $ordered[2]['x'] - $ordered[3]['x'];
        $botDy = $ordered[2]['y'] - $ordered[3]['y'];

        $topAngle = atan2($topDy, $topDx);
        $botAngle = atan2($botDy, $botDx);

        $diff = $botAngle - $topAngle;
        while ($diff > M_PI) {
            $diff -= 2 * M_PI;
        }
        while ($diff < -M_PI) {
            $diff += 2 * M_PI;
        }

        if (abs($diff) > M_PI / 2) {
            [$topAngle, $botAngle] = [$botAngle, $topAngle];
        }

        $mean = atan2(sin($topAngle) + sin($botAngle), cos($topAngle) + cos($botAngle));

        return rad2deg($mean);
    }

    // ════════════════════════════════════════════════════════════
    //  Perspective / Deskew
    // ════════════════════════════════════════════════════════════

    /**
     * @param list<array{x: float, y: float}> $srcCorners TL,TR,BR,BL in source pixels
     */
    private function warpToQuad(\GdImage $src, array $srcCorners): ?\GdImage
    {
        $srcW = imagesx($src);
        $srcH = imagesy($src);

        foreach ($srcCorners as $c) {
            if ($c['x'] < -5 || $c['y'] < -5 || $c['x'] > $srcW + 5 || $c['y'] > $srcH + 5) {
                return null;
            }
        }

        $topW = hypot($srcCorners[1]['x'] - $srcCorners[0]['x'], $srcCorners[1]['y'] - $srcCorners[0]['y']);
        $botW = hypot($srcCorners[2]['x'] - $srcCorners[3]['x'], $srcCorners[2]['y'] - $srcCorners[3]['y']);
        $leftH = hypot($srcCorners[3]['x'] - $srcCorners[0]['x'], $srcCorners[3]['y'] - $srcCorners[0]['y']);
        $rightH = hypot($srcCorners[2]['x'] - $srcCorners[1]['x'], $srcCorners[2]['y'] - $srcCorners[1]['y']);

        $dstW = (int) round(max($topW, $botW));
        $dstH = (int) round(max($leftH, $rightH));

        if ($dstW < 60 || $dstH < 60) {
            return null;
        }

        $outScale = min(1.0, $this->maxDimension / max($dstW, $dstH));
        $dstW = max(1, (int) round($dstW * $outScale));
        $dstH = max(1, (int) round($dstH * $outScale));

        $aspect = max($dstW, $dstH) / max(1, min($dstW, $dstH));
        if ($aspect > 3.4) {
            return null;
        }

        $dstCorners = [
            ['x' => 0.0, 'y' => 0.0],
            ['x' => (float) $dstW, 'y' => 0.0],
            ['x' => (float) $dstW, 'y' => (float) $dstH],
            ['x' => 0.0, 'y' => (float) $dstH],
        ];

        $h = $this->computeHomography($dstCorners, $srcCorners);
        if ($h === null) {
            return null;
        }

        $dst = imagecreatetruecolor($dstW, $dstH);
        imagefill($dst, 0, 0, imagecolorallocate($dst, 255, 255, 255));

        [$h00, $h01, $h02, $h10, $h11, $h12, $h20, $h21] = $h;

        for ($dy = 0; $dy < $dstH; $dy++) {
            for ($dx = 0; $dx < $dstW; $dx++) {
                $denom = $h20 * $dx + $h21 * $dy + 1.0;
                if (abs($denom) < 1e-10) {
                    continue;
                }

                $sx = ($h00 * $dx + $h01 * $dy + $h02) / $denom;
                $sy = ($h10 * $dx + $h11 * $dy + $h12) / $denom;

                if ($sx < 0 || $sx >= $srcW - 1 || $sy < 0 || $sy >= $srcH - 1) {
                    continue;
                }

                $x0 = (int) $sx;
                $y0 = (int) $sy;
                $x1 = min($x0 + 1, $srcW - 1);
                $y1 = min($y0 + 1, $srcH - 1);
                $fx = $sx - $x0;
                $fy = $sy - $y0;

                $c00 = imagecolorat($src, $x0, $y0);
                $c10 = imagecolorat($src, $x1, $y0);
                $c01 = imagecolorat($src, $x0, $y1);
                $c11 = imagecolorat($src, $x1, $y1);

                $r = (int) (
                    (($c00 >> 16) & 0xFF) * (1 - $fx) * (1 - $fy) +
                    (($c10 >> 16) & 0xFF) * $fx * (1 - $fy) +
                    (($c01 >> 16) & 0xFF) * (1 - $fx) * $fy +
                    (($c11 >> 16) & 0xFF) * $fx * $fy
                );
                $g = (int) (
                    (($c00 >> 8) & 0xFF) * (1 - $fx) * (1 - $fy) +
                    (($c10 >> 8) & 0xFF) * $fx * (1 - $fy) +
                    (($c01 >> 8) & 0xFF) * (1 - $fx) * $fy +
                    (($c11 >> 8) & 0xFF) * $fx * $fy
                );
                $b = (int) (
                    ($c00 & 0xFF) * (1 - $fx) * (1 - $fy) +
                    ($c10 & 0xFF) * $fx * (1 - $fy) +
                    ($c01 & 0xFF) * (1 - $fx) * $fy +
                    ($c11 & 0xFF) * $fx * $fy
                );

                imagesetpixel($dst, $dx, $dy, imagecolorallocate($dst, $r, $g, $b));
            }
        }

        return $dst;
    }

    /**
     * @param list<array{x: float, y: float}> $src
     * @param list<array{x: float, y: float}> $dst
     * @return list<float>|null
     */
    private function computeHomography(array $src, array $dst): ?array
    {
        $matrix = [];
        $rhs = [];

        for ($i = 0; $i < 4; $i++) {
            $sx = $src[$i]['x'];
            $sy = $src[$i]['y'];
            $dx = $dst[$i]['x'];
            $dy = $dst[$i]['y'];

            $matrix[] = [$sx, $sy, 1, 0, 0, 0, -$sx * $dx, -$sy * $dx];
            $rhs[] = $dx;

            $matrix[] = [0, 0, 0, $sx, $sy, 1, -$sx * $dy, -$sy * $dy];
            $rhs[] = $dy;
        }

        $solution = $this->solveLinearSystem8($matrix, $rhs);
        if ($solution === null) {
            return null;
        }

        return [$solution[0], $solution[1], $solution[2], $solution[3], $solution[4], $solution[5], $solution[6], $solution[7]];
    }

    /** @param list<list<float>> $matrix @param list<float> $rhs */
    private function solveLinearSystem8(array $matrix, array $rhs): ?array
    {
        $n = 8;
        $aug = [];
        for ($i = 0; $i < $n; $i++) {
            $aug[$i] = $matrix[$i];
            $aug[$i][] = $rhs[$i];
        }

        for ($col = 0; $col < $n; $col++) {
            $maxRow = $col;
            $maxVal = abs($aug[$col][$col]);
            for ($row = $col + 1; $row < $n; $row++) {
                if (abs($aug[$row][$col]) > $maxVal) {
                    $maxVal = abs($aug[$row][$col]);
                    $maxRow = $row;
                }
            }

            if ($maxVal < 1e-10) {
                return null;
            }

            [$aug[$col], $aug[$maxRow]] = [$aug[$maxRow], $aug[$col]];

            $pivot = $aug[$col][$col];
            for ($j = $col; $j <= $n; $j++) {
                $aug[$col][$j] /= $pivot;
            }

            for ($row = 0; $row < $n; $row++) {
                if ($row === $col) {
                    continue;
                }
                $factor = $aug[$row][$col];
                for ($j = $col; $j <= $n; $j++) {
                    $aug[$row][$j] -= $factor * $aug[$col][$j];
                }
            }
        }

        return array_column($aug, $n);
    }

    private function estimateSkewByProjection(\GdImage $image): ?float
    {
        $w = imagesx($image);
        $h = imagesy($image);
        $scale = min(1.0, 400.0 / max($w, $h));
        $sw = max(8, (int) round($w * $scale));
        $sh = max(8, (int) round($h * $scale));

        $small = imagecreatetruecolor($sw, $sh);
        imagecopyresampled($small, $image, 0, 0, 0, 0, $sw, $sh, $w, $h);

        $energyAt = function (float $angle) use ($small): float {
            if ($angle == 0.0) {
                $rot = $small;
            } else {
                $rot = imagerotate($small, $angle, 16777215);
                if ($rot === false) {
                    return 0.0;
                }
            }

            $rw = imagesx($rot);
            $rh = imagesy($rot);
            $rowSums = array_fill(0, $rh, 0.0);

            for ($y = 0; $y < $rh; $y++) {
                $sum = 0;
                for ($x = 0; $x < $rw; $x++) {
                    $sum += 255 - $this->lumAt($rot, $x, $y);
                }
                $rowSums[$y] = $sum;
            }

            if ($rot !== $small) {
                imagedestroy($rot);
            }

            $energy = 0.0;
            for ($y = 1; $y < $rh; $y++) {
                $d = $rowSums[$y] - $rowSums[$y - 1];
                $energy += $d * $d;
            }

            return $energy;
        };

        $baseEnergy = $energyAt(0.0);
        if ($baseEnergy <= 0) {
            imagedestroy($small);
            return null;
        }

        $bestAngle = 0.0;
        $bestEnergy = $baseEnergy;

        for ($angle = -10.0; $angle <= 10.5; $angle += 2.0) {
            if ($angle == 0.0) {
                continue;
            }
            $energy = $energyAt($angle);
            if ($energy > $bestEnergy) {
                $bestEnergy = $energy;
                $bestAngle = $angle;
            }
        }

        if ($bestAngle != 0.0) {
            for ($angle = $bestAngle - 1.5; $angle <= $bestAngle + 1.5; $angle += 0.5) {
                if (abs($angle) < 0.01) {
                    continue;
                }
                $energy = $energyAt($angle);
                if ($energy > $bestEnergy) {
                    $bestEnergy = $energy;
                    $bestAngle = $angle;
                }
            }
        }

        imagedestroy($small);

        $peakRatio = $bestEnergy / max(1.0, $baseEnergy);
        if (abs($bestAngle) < 0.8 || $peakRatio < 2.2) {
            return null;
        }

        return $bestAngle;
    }

    private function rotateAndTrim(\GdImage $image, float $angleDegrees): ?\GdImage
    {
        $w = imagesx($image);
        $h = imagesy($image);

        $theta = deg2rad(abs($angleDegrees));
        $cos = cos($theta);
        $sin = sin($theta);

        $preScale = min(1.0, $this->maxDimension / max($w * $cos + $h * $sin, $w * $sin + $h * $cos));
        if ($preScale < 1.0) {
            $nw = max(1, (int) round($w * $preScale));
            $nh = max(1, (int) round($h * $preScale));
            $scaled = imagecreatetruecolor($nw, $nh);
            imagefill($scaled, 0, 0, imagecolorallocate($scaled, 255, 255, 255));
            imagecopyresampled($scaled, $image, 0, 0, 0, 0, $nw, $nh, $w, $h);
            imagedestroy($image);
            $image = $scaled;
            $w = $nw;
            $h = $nh;
        }

        $rotated = imagerotate($image, $angleDegrees, 16777215);
        if ($rotated === false) {
            return null;
        }

        $rw = imagesx($rotated);
        $rh = imagesy($rotated);

        $cos2 = $cos * $cos - $sin * $sin;
        $innerW = $innerH = 0;

        if (abs($cos2) > 0.05) {
            $innerW = (int) floor((($w * $cos - $h * $sin) / $cos2));
            $innerH = (int) floor((($h * $cos - $w * $sin) / $cos2));
        }

        $innerW = max(0, min($innerW, $rw));
        $innerH = max(0, min($innerH, $rh));

        if ($innerW < 50 || $innerH < 50 || ($innerW * $innerH) < ($w * $h) * 0.55) {
            $cropW = $rw;
            $cropH = $rh;
        } else {
            $bboxW = min($rw, (int) ceil($w * $cos + $h * $sin));
            $bboxH = min($rh, (int) ceil($w * $sin + $h * $cos));
            $cropW = min($rw, (int) round($innerW + ($bboxW - $innerW) * 0.5));
            $cropH = min($rh, (int) round($innerH + ($bboxH - $innerH) * 0.5));
        }

        $cropX = (int) (($rw - $cropW) / 2);
        $cropY = (int) (($rh - $cropH) / 2);

        $out = imagecreatetruecolor($cropW, $cropH);
        imagefill($out, 0, 0, imagecolorallocate($out, 255, 255, 255));
        imagecopy($out, $rotated, 0, 0, $cropX, $cropY, $cropW, $cropH);
        imagedestroy($rotated);
        imagedestroy($image);

        return $this->resizeWithinBounds($out);
    }

    // ════════════════════════════════════════════════════════════
    //  Enhancement
    // ════════════════════════════════════════════════════════════

    private function applyToneCorrection(\GdImage $image, ScanAnalysis $analysis, string $mode): ?\GdImage
    {
        if ($mode === self::MODE_GRAY) {
            return $this->grayscaleWithStretch($image, $analysis);
        }

        $needsTone = $analysis->isDark() || $analysis->isLowContrast();
        if (! $needsTone) {
            return null;
        }

        $lo = max(0, $analysis->p1 - 4);
        $hi = min(255, $analysis->paperLevel + 4);

        if ($hi - $lo < 60) {
            return null;
        }

        $gamma = $analysis->isDark() ? 0.82 : 1.0;

        $lut = [];
        for ($i = 0; $i < 256; $i++) {
            $v = ($i - $lo) / ($hi - $lo);
            $v = max(0.0, min(1.08, $v));
            $lut[$i] = (int) max(0, min(255, round(252 * pow($v, $gamma))));
        }

        return $this->applySingleLut($image, $lut);
    }

    /**
     * Gentle luminance-only lift (gamma curve, no range remap) for damaged sources
     * where the full stretch fails the noise gate. Same LUT on R,G,B → hue preserved.
     */
    private function applyGentleTone(\GdImage $image, ScanAnalysis $analysis): \GdImage
    {
        $paper = max(120.0, min(250.0, (float) $analysis->paperLevel));
        $gamma = log(236.0 / 255) / log($paper / 255);
        $gamma = max(0.72, min(0.95, $gamma));

        $lut = [];
        for ($i = 0; $i < 256; $i++) {
            $lut[$i] = (int) max(0, min(255, round(255 * pow($i / 255, $gamma))));
        }

        return $this->applySingleLut($image, $lut);
    }

    private function grayscaleWithStretch(\GdImage $image, ScanAnalysis $analysis): \GdImage
    {
        $w = imagesx($image);
        $h = imagesy($image);

        $lo = max(0, $analysis->p1 - 4);
        $hi = min(255, $analysis->paperLevel + 4);
        $range = max(1, $hi - $lo);

        $out = imagecreatetruecolor($w, $h);

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $rgb = imagecolorat($image, $x, $y);
                $lum = (int) (0.299 * (($rgb >> 16) & 0xFF) + 0.587 * (($rgb >> 8) & 0xFF) + 0.114 * ($rgb & 0xFF));
                $v = max(0, min(255, (($lum - $lo) / $range) * 250));
                $val = (int) $v;
                imagesetpixel($out, $x, $y, imagecolorallocate($out, $val, $val, $val));
            }
        }

        imagedestroy($image);

        return $out;
    }

    /** @param array<int, int> $lut */
    private function applySingleLut(\GdImage $image, array $lut): \GdImage
    {
        $w = imagesx($image);
        $h = imagesy($image);
        $out = imagecreatetruecolor($w, $h);

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $rgb = imagecolorat($image, $x, $y);
                imagesetpixel(
                    $out,
                    $x,
                    $y,
                    imagecolorallocate($out, $lut[($rgb >> 16) & 0xFF], $lut[($rgb >> 8) & 0xFF], $lut[$rgb & 0xFF]),
                );
            }
        }

        imagedestroy($image);

        return $out;
    }

    private function shouldSharpen(ScanAnalysis $analysis, string $mode): bool
    {
        if ($mode === self::MODE_PRESERVE) {
            return false;
        }

        if ($mode === self::MODE_GRAY) {
            return $analysis->isSoft() && $analysis->noise <= 9;
        }

        return $analysis->isSoft() && ! $analysis->isNoisy();
    }

    private function convolutionSharpen(\GdImage $image, float $strength): ?\GdImage
    {
        $center = 1.0 + 4.0 * $strength;
        $kernel = [
            [0.0, -$strength, 0.0],
            [-$strength, $center, -$strength],
            [0.0, -$strength, 0.0],
        ];

        $ok = imageconvolution($image, $kernel, 1.0, 0.0);

        return $ok ? $image : null;
    }

    // ════════════════════════════════════════════════════════════
    //  Quality Validation
    // ════════════════════════════════════════════════════════════

    /** @return array{metrics: ScanAnalysis, grid: list<list<int>>} */
    private function snapshotReference(\GdImage $oriented): array
    {
        return [
            'metrics' => $this->analyze($oriented),
            'grid' => $this->downsampleGrid($oriented, 32),
        ];
    }

    /** @return list<list<int>> */
    private function downsampleGrid(\GdImage $image, int $size): array
    {
        $small = imagecreatetruecolor($size, $size);
        imagecopyresampled($small, $image, 0, 0, 0, 0, $size, $size, imagesx($image), imagesy($image));

        $grid = [];
        for ($y = 0; $y < $size; $y++) {
            for ($x = 0; $x < $size; $x++) {
                $grid[$y][$x] = imagecolorat($small, $x, $y);
            }
        }
        imagedestroy($small);

        return $grid;
    }

    /** @return array{ok: bool, reason: string|null} */
    private function validateCandidate(\GdImage $candidate, array $snapshot, bool $geometryChanged, bool $toneChanged = false): array
    {
        $w = imagesx($candidate);
        $h = imagesy($candidate);

        if ($w < $this->minOutputDimension || $h < $this->minOutputDimension) {
            return ['ok' => false, 'reason' => 'الأبعاد صغيرة جداً'];
        }

        $aspect = max($w, $h) / max(1, min($w, $h));
        if ($aspect > 3.4) {
            return ['ok' => false, 'reason' => 'نسبة أبعاد غير منطقية'];
        }

        $srcMetrics = $snapshot['metrics'];
        $areaRatio = ($w * $h) / max(1, $srcMetrics->width * $srcMetrics->height);
        if ($areaRatio < 0.25) {
            return ['ok' => false, 'reason' => 'فقدان كبير في مساحة المحتوى'];
        }

        $metrics = $this->analyze($candidate);

        if ($metrics->brightnessMean < 105 || $metrics->brightnessMean > 253) {
            return ['ok' => false, 'reason' => 'سطوع خارج النطاق الآمن'];
        }

        $brightnessDeltaLimit = $srcMetrics->brightnessMean < 170
            ? min(140, max(100, 262 - $srcMetrics->brightnessMean))
            : 75;
        if (abs($metrics->brightnessMean - $srcMetrics->brightnessMean) > $brightnessDeltaLimit) {
            return ['ok' => false, 'reason' => 'تغير مفرط في السطوع'];
        }

        if ($metrics->saturationMean > $srcMetrics->saturationMean * 1.8 + 0.06) {
            return ['ok' => false, 'reason' => 'تشبع ألوان مفرط'];
        }

        $castLimitRG = max(38, abs($srcMetrics->castRG) * 1.6 + 15);
        $castLimitGB = max(38, abs($srcMetrics->castGB) * 1.6 + 15);
        if (abs($metrics->castRG - $srcMetrics->castRG) > $castLimitRG || abs($metrics->castGB - $srcMetrics->castGB) > $castLimitGB) {
            return ['ok' => false, 'reason' => 'انحراف لوني عن الأصل'];
        }

        if ($metrics->sharpness > $srcMetrics->sharpness * 6 + 4000) {
            return ['ok' => false, 'reason' => 'تضخم ضوضاء بعد المعالجة'];
        }

        if ($geometryChanged && ! $this->textStructurePreserved($candidate, $srcMetrics->sharpness)) {
            return ['ok' => false, 'reason' => 'تفكك بنية النص بعد التحويل الهندسي'];
        }

        if (! $geometryChanged && ! $toneChanged) {
            $candidateGrid = $this->downsampleGrid($candidate, 32);
            $mad = $this->gridMeanAbsDiff($candidateGrid, $snapshot['grid']);
            if ($mad > 18) {
                return ['ok' => false, 'reason' => 'اختلاف بنيوي عن الأصل'];
            }
        }

        return ['ok' => true, 'reason' => null];
    }

    private function textStructurePreserved(\GdImage $candidate, float $srcSharpness): bool
    {
        $w = imagesx($candidate);
        $h = imagesy($candidate);

        $cropW = (int) ($w * 0.5);
        $cropH = (int) ($h * 0.5);
        $center = imagecreatetruecolor($cropW, $cropH);
        imagecopy($center, $candidate, 0, 0, (int) (($w - $cropW) / 2), (int) (($h - $cropH) / 2), $cropW, $cropH);

        $analysis = $this->analyze($center);
        imagedestroy($center);

        return $analysis->sharpness >= $srcSharpness * 0.30;
    }

    /** @param list<list<int>> $a @param list<list<int>> $b */
    private function gridMeanAbsDiff(array $a, array $b): float
    {
        $total = 0.0;
        $n = 0;
        $size = count($a);
        for ($y = 0; $y < $size; $y++) {
            for ($x = 0; $x < $size; $x++) {
                $pa = $a[$y][$x];
                $pb = $b[$y][$x];
                for ($ch = 0; $ch < 3; $ch++) {
                    $total += abs((($pa >> ($ch * 8)) & 0xFF) - (($pb >> ($ch * 8)) & 0xFF));
                }
                $n++;
            }
        }
        return $n > 0 ? $total / ($n * 3) : 0.0;
    }

    // ════════════════════════════════════════════════════════════
    //  Fallback / Encode
    // ════════════════════════════════════════════════════════════

    private function safeFallback(string $bytes, string $mode, ?int $exifOrientation, string $reason): ScanResult
    {
        try {
            return $this->safeFallbackFromImage(null, $bytes, $mode, $exifOrientation, $reason);
        } catch (\Throwable $e) {
            report($e);
            $tiny = @imagecreate(1, 1);
            if ($tiny !== false) {
                imagedestroy($tiny);
            }
            throw new InvalidArgumentException('Scan processing failed irrecoverably: ' . $reason, 0, $e);
        }
    }

    private function safeFallbackFromImage(?\GdImage $oriented, string $bytes, string $mode, ?int $exifOrientation, string $reason): ScanResult
    {
        if ($oriented === null) {
            $oriented = $this->decodeAndOrient($bytes, $exifOrientation);
        }

        $safe = $this->resizeWithinBounds($oriented);
        $encoded = $this->encodeJpeg($safe);

        $metrics = $this->analyze($safe);
        imagedestroy($safe);

        $this->record('fallback', 'استخدام النسخة الآمنة', 'done', $reason);
        $this->observe('fallback', null, ['bytes' => strlen($encoded), 'reason' => $reason]);

        return new ScanResult(
            bytes: $encoded,
            width: $metrics->width,
            height: $metrics->height,
            mode: $mode,
            stages: $this->stages,
            quality: [
                'brightness' => round($metrics->brightnessMean, 1),
                'saturation' => round($metrics->saturationMean * 100, 1),
                'sharpness' => round($metrics->sharpness),
                'level' => 'original',
            ],
            fallbackUsed: true,
            fallbackReason: $reason,
        );
    }

    private function encodeJpeg(\GdImage $image): string
    {
        ob_start();
        $success = imagejpeg($image, null, $this->jpegQuality);
        $data = ob_get_clean();

        if (! $success || $data === false || strlen($data) < 1024) {
            throw new \RuntimeException('JPEG encoding failed.');
        }

        return $data;
    }

    private function analyzeFromBytes(string $bytes): ScanAnalysis
    {
        $img = @imagecreatefromstring($bytes);
        if ($img === false) {
            throw new \RuntimeException('Encoded output is not decodable.');
        }
        $analysis = $this->analyze($img);
        imagedestroy($img);
        return $analysis;
    }

    private function qualityLevel(bool $processed, string $mode): string
    {
        if ($mode === self::MODE_PRESERVE) {
            return 'original';
        }

        return $processed ? 'good' : 'excellent';
    }

    private function record(string $key, string $label, string $status, ?string $detail = null): void
    {
        $stage = ['key' => $key, 'label' => $label, 'status' => $status];
        if ($detail !== null) {
            $stage['detail'] = $detail;
        }
        $this->stages[] = $stage;
    }
}
