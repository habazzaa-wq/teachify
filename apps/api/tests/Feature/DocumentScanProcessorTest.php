<?php

namespace Tests\Feature;

use App\Services\ExamBank\Scan\DocumentScanProcessor;
use Tests\TestCase;

class DocumentScanProcessorTest extends TestCase
{
    private string $tempDir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tempDir = storage_path('app/testing/scan-processor-' . uniqid());
        if (! is_dir($this->tempDir)) {
            mkdir($this->tempDir, 0777, true);
        }
    }

    protected function tearDown(): void
    {
        if (is_dir($this->tempDir)) {
            foreach (glob($this->tempDir . '/*') ?: [] as $f) {
                @unlink($f);
            }
            @rmdir($this->tempDir);
        }
        parent::tearDown();
    }

    public function test_clean_colored_page_is_preserved_without_destructive_enhancement(): void
    {
        $bytes = $this->renderTextbookPage(1200, 1650, brightness: 1.0);
        $original = imagecreatefromstring($bytes);

        $result = (new DocumentScanProcessor())->process($bytes, 'auto');

        $processed = imagecreatefromstring($result->bytes);
        $this->assertNotFalse($processed);

        $this->assertSame(imagesx($original), $result->width);
        $this->assertSame(imagesy($original), $result->height);
        $this->assertFalse($result->fallbackUsed);
        $this->assertSame('excellent', $result->quality['level']);

        $origMetrics = $this->sampleStats($original);
        $procMetrics = $this->sampleStats($processed);

        $this->assertEqualsWithDelta($origMetrics['brightness'], $procMetrics['brightness'], 6);
        $this->assertEqualsWithDelta($origMetrics['r'], $procMetrics['r'], 8);
        $this->assertEqualsWithDelta($origMetrics['g'], $procMetrics['g'], 8);
        $this->assertEqualsWithDelta($origMetrics['b'], $procMetrics['b'], 8);
        $this->assertGreaterThan(0.5, $procMetrics['sharpness'] / max(1, $origMetrics['sharpness']));
        $this->assertLessThan(2.0, $procMetrics['sharpness'] / max(1, $origMetrics['sharpness']));

        imagedestroy($original);
        imagedestroy($processed);
    }

    public function test_low_light_page_is_brightened_without_fallback_and_hue_is_preserved(): void
    {
        $bytes = $this->renderTextbookPage(1200, 1650, brightness: 0.45, warmCast: true);

        $result = (new DocumentScanProcessor())->process($bytes, 'auto');

        $processed = imagecreatefromstring($result->bytes);
        $this->assertNotFalse($processed);
        $this->assertFalse($result->fallbackUsed);

        $metrics = $this->sampleStats($processed);
        $this->assertGreaterThan(180, $metrics['brightness']);
        $this->assertLessThan(254, $metrics['brightness']);

        $this->assertGreaterThan($metrics['b'], $metrics['r']);

        imagedestroy($processed);
    }

    public function test_original_preserve_mode_skips_geometry_and_enhancement(): void
    {
        $bytes = $this->renderTextbookPage(1000, 1400, brightness: 0.5);

        $result = (new DocumentScanProcessor())->process($bytes, 'original_preserve');

        $this->assertFalse($result->fallbackUsed);
        $this->assertSame('original', $result->quality['level']);
        $this->assertFalse($result->enhanced);
        $this->assertFalse($result->perspectiveCorrected);
        $this->assertFalse($result->deskewed);

        $processed = imagecreatefromstring($result->bytes);
        $metrics = $this->sampleStats($processed);
        $this->assertLessThan(160, $metrics['brightness']);
        imagedestroy($processed);
    }

    public function test_grayscale_mode_outputs_neutral_gray(): void
    {
        $bytes = $this->renderTextbookPage(1000, 1400, brightness: 1.0);

        $result = (new DocumentScanProcessor())->process($bytes, 'grayscale_document');

        $processed = imagecreatefromstring($result->bytes);
        $this->assertNotFalse($processed);

        $w = imagesx($processed);
        $h = imagesy($processed);
        $maxChannelDiff = 0;
        for ($y = 0; $y < $h; $y += 17) {
            for ($x = 0; $x < $w; $x += 17) {
                $rgb = imagecolorat($processed, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;
                $maxChannelDiff = max($maxChannelDiff, abs($r - $g), abs($g - $b));
            }
        }
        $this->assertLessThanOrEqual(6, $maxChannelDiff);
        imagedestroy($processed);
    }

    public function test_output_is_always_decodable_jpeg_within_quality_bounds(): void
    {
        $bytes = $this->renderTextbookPage(900, 1300, brightness: 0.9);

        $result = (new DocumentScanProcessor())->process($bytes, 'auto');

        $this->assertGreaterThan(1024, strlen($result->bytes));
        $info = @getimagesizefromstring($result->bytes);
        $this->assertNotFalse($info);
        $this->assertSame('image/jpeg', $info['mime']);
        $this->assertGreaterThanOrEqual(250, min($result->width, $result->height));
    }

    public function test_damaged_page_uses_graded_gentle_enhancement_without_fallback(): void
    {
        $bytes = $this->renderDamagedPage(1174, 1600);
        $original = imagecreatefromstring($bytes);
        $origMetrics = $this->sampleStats($original);

        $result = (new DocumentScanProcessor())->process($bytes, 'auto');

        $processed = imagecreatefromstring($result->bytes);
        $this->assertNotFalse($processed);
        $this->assertFalse($result->fallbackUsed);
        $this->assertTrue($result->enhanced);

        $metrics = $this->sampleStats($processed);

        $this->assertGreaterThan($origMetrics['brightness'] + 10, $metrics['brightness']);
        $this->assertLessThan(250, $metrics['brightness']);
        $this->assertLessThanOrEqual($origMetrics['sharpness'] * 6 + 4000, $metrics['sharpness']);

        imagedestroy($original);
        imagedestroy($processed);
    }

    public function test_bw_mode_produces_near_binary_scanner_output(): void
    {
        $bytes = $this->renderDamagedPage(1174, 1600);

        $result = (new DocumentScanProcessor())->process($bytes, 'bw_document');

        $processed = imagecreatefromstring($result->bytes);
        $this->assertNotFalse($processed);
        $this->assertFalse($result->fallbackUsed);
        $this->assertTrue($result->enhanced);
        $this->assertSame('excellent', $result->quality['level']);

        $w = imagesx($processed);
        $h = imagesy($processed);
        $step = max(1, (int) floor(min($w, $h) / 200));
        $extremes = 0;
        $total = 0;
        for ($y = 0; $y < $h; $y += $step) {
            for ($x = 0; $x < $w; $x += $step) {
                $lum = $this->pixelLum($processed, $x, $y);
                if ($lum <= 30 || $lum >= 225) {
                    $extremes++;
                }
                $total++;
            }
        }
        $this->assertGreaterThan(0.85, $extremes / max(1, $total));

        imagedestroy($processed);
    }

    public function test_page_on_dark_background_is_extracted_by_content(): void
    {
        $bytes = $this->renderPageOnDarkBackground(1400, 1750);

        $original = imagecreatefromstring($bytes);
        $origPixels = imagesx($original) * imagesy($original);
        imagedestroy($original);

        $result = (new DocumentScanProcessor())->process($bytes, 'bw_document');

        $this->assertFalse($result->fallbackUsed);

        $outPixels = $result->width * $result->height;
        $this->assertLessThan($origPixels * 0.92, $outPixels, 'background should be cropped away');
        $this->assertGreaterThan($origPixels * 0.25, $outPixels, 'page content must be kept');

        $processed = imagecreatefromstring($result->bytes);
        $this->assertNotFalse($processed);
        imagedestroy($processed);
    }

    // ── helpers ──────────────────────────────────────────────

    private function renderTextbookPage(int $w, int $h, float $brightness = 1.0, bool $warmCast = false): string
    {
        $page = imagecreatetruecolor($w, $h);
        $paper = imagecolorallocate($page, 252, 252, 248);
        imagefill($page, 0, 0, $paper);

        $black = imagecolorallocate($page, 25, 25, 25);
        $blue = imagecolorallocate($page, 20, 60, 180);
        $highlight = imagecolorallocate($page, 255, 230, 120);

        imagefilledrectangle($page, (int) ($w * 0.08), (int) ($h * 0.05), (int) ($w * 0.6), (int) ($h * 0.09), $highlight);
        imagettftext($page, (int) ($w * 0.03), 0, (int) ($w * 0.08), (int) ($h * 0.085), $blue, $this->font(), 'Quadratic Equations');

        for ($i = 0; $i < 14; $i++) {
            $y = (int) ($h * (0.14 + $i * 0.05));
            imagettftext(
                $page,
                (int) ($w * 0.02),
                0,
                (int) ($w * 0.08),
                $y,
                $black,
                $this->font(),
                'To solve the equation we first write it in standard form.',
            );
        }

        if ($brightness < 1.0 || $warmCast) {
            for ($y = 0; $y < $h; $y++) {
                for ($x = 0; $x < $w; $x++) {
                    $rgb = imagecolorat($page, $x, $y);
                    $r = (int) ((($rgb >> 16) & 0xFF) * $brightness * ($warmCast ? 1.12 : 1.0));
                    $g = (int) ((($rgb >> 8) & 0xFF) * $brightness * ($warmCast ? 1.02 : 1.0));
                    $b = (int) (($rgb & 0xFF) * $brightness * ($warmCast ? 0.82 : 1.0));
                    imagesetpixel($page, $x, $y, imagecolorallocate($page, min(255, $r), min(255, $g), min(255, $b)));
                }
            }
        }

        ob_start();
        imagejpeg($page, null, 85);
        $bytes = ob_get_clean();
        imagedestroy($page);

        return $bytes;
    }

    private function renderPageOnDarkBackground(int $w, int $h): string
    {
        $frame = imagecreatetruecolor($w, $h);
        $desk = imagecolorallocate($frame, 62, 58, 52);
        imagefill($frame, 0, 0, $desk);

        $pageW = (int) ($w * 0.68);
        $pageH = (int) ($h * 0.74);
        $pageX = (int) ($w * 0.17);
        $pageY = (int) ($h * 0.13);

        $pageBytes = $this->renderTextbookPage($pageW, $pageH, brightness: 0.85);
        $page = imagecreatefromstring($pageBytes);
        imagecopy($frame, $page, $pageX, $pageY, 0, 0, $pageW, $pageH);
        imagedestroy($page);

        ob_start();
        imagejpeg($frame, null, 88);
        $bytes = ob_get_clean();
        imagedestroy($frame);

        return $bytes;
    }

    private function renderDamagedPage(int $w, int $h): string
    {
        $bytes = $this->renderTextbookPage($w, $h, brightness: 0.62);

        for ($i = 0; $i < 3; $i++) {
            $img = imagecreatefromstring($bytes);
            ob_start();
            imagejpeg($img, null, 35);
            $bytes = ob_get_clean();
            imagedestroy($img);
        }

        return $bytes;
    }

    private function font(): string
    {
        $candidates = [
            'C:/Windows/Fonts/times.ttf',
            'C:/Windows/Fonts/arial.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        ];
        foreach ($candidates as $f) {
            if (is_file($f)) {
                return $f;
            }
        }
        $this->markTestSkipped('No TTF font available for rendering test images.');
    }

    /** @return array{brightness: float, r: float, g: float, b: float, sharpness: float} */
    private function sampleStats(\GdImage $img): array
    {
        $w = imagesx($img);
        $h = imagesy($img);
        $step = max(1, (int) floor(min($w, $h) / 300));

        $sumR = $sumG = $sumB = $sumL = 0.0;
        $n = 0;
        for ($y = 0; $y < $h; $y += $step) {
            for ($x = 0; $x < $w; $x += $step) {
                $rgb = imagecolorat($img, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;
                $sumR += $r;
                $sumG += $g;
                $sumB += $b;
                $sumL += 0.299 * $r + 0.587 * $g + 0.114 * $b;
                $n++;
            }
        }

        $lapSum = 0.0;
        $lapSum2 = 0.0;
        $ln = 0;
        for ($y = $step; $y < $h - $step; $y += $step) {
            for ($x = $step; $x < $w - $step; $x += $step) {
                $lum = fn($x, $y): float => $this->pixelLum($img, $x, $y);
                $v = 4 * $lum($x, $y) - $lum($x - $step, $y) - $lum($x + $step, $y) - $lum($x, $y - $step) - $lum($x, $y + $step);
                $lapSum += $v;
                $lapSum2 += $v * $v;
                $ln++;
            }
        }
        $lapMean = $ln > 0 ? $lapSum / $ln : 0.0;

        return [
            'brightness' => $sumL / max(1, $n),
            'r' => $sumR / max(1, $n),
            'g' => $sumG / max(1, $n),
            'b' => $sumB / max(1, $n),
            'sharpness' => $ln > 0 ? max(0, $lapSum2 / $ln - $lapMean ** 2) : 0.0,
        ];
    }

    private function pixelLum(\GdImage $img, int $x, int $y): float
    {
        $rgb = imagecolorat($img, $x, $y);
        return 0.299 * (($rgb >> 16) & 0xFF) + 0.587 * (($rgb >> 8) & 0xFF) + 0.114 * ($rgb & 0xFF);
    }
}
