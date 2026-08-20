<?php

namespace App\Services\ExamBank;

use App\Models\MediaAsset;
use App\Models\Question;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Media\MediaLibraryService;
use App\Services\Media\StoragePathGenerator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ScannedQuestionService
{
    private const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    private const MAX_FILE_SIZE = 10 * 1024 * 1024;
    private const MAX_DIMENSION = 2400;
    private const JPEG_QUALITY = 88;
    private const EDGE_SAMPLE_SIZE = 640;
    private const WHITE_THRESHOLD = 230;
    private const CONTENT_MARGIN_PX = 15;
    private const EDGE_THRESHOLD = 40;

    public function __construct(
        private readonly MediaLibraryService $mediaLibrary,
        private readonly StoragePathGenerator $pathGenerator,
    ) {}

    public function validateUpload(UploadedFile $file): array
    {
        $errors = [];

        if (! in_array($file->getMimeType(), self::ALLOWED_MIME_TYPES, true)) {
            $errors['file'] = 'نوع الملف غير مدعوم. يُسمح فقط بصيغ JPEG و PNG و WebP.';
            return $errors;
        }

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            $errors['file'] = 'حجم الملف يتجاوز الحد الأقصى المسموح (10 ميجابايت).';
            return $errors;
        }

        $contents = file_get_contents($file->getRealPath());
        if ($contents === false) {
            $errors['file'] = 'لا يمكن قراءة الملف المرفوع.';
            return $errors;
        }

        $imageInfo = @getimagesizefromstring($contents);
        if ($imageInfo === false) {
            $errors['file'] = 'الملف المرفوع ليس صورة صالحة.';
            return $errors;
        }

        return $errors;
    }

    public function processScan(Tenant $tenant, TenantUser $uploader, Question $question, UploadedFile $file): MediaAsset
    {
        $tempFile = $this->storeTempFile($file);

        try {
            $imageData = file_get_contents($tempFile);
            if ($imageData === false) {
                throw ValidationException::withMessages([
                    'file' => ['لا يمكن قراءة الملف المرفوع.'],
                ]);
            }

            $gdImage = $this->loadImageFromData($imageData, $file->getMimeType());
            if ($gdImage === false) {
                throw ValidationException::withMessages([
                    'file' => ['فشل في تحميل الصورة. تأكد من أن الملف غير تالف.'],
                ]);
            }

            $gdImage = $this->autoOrient($gdImage, $tempFile, $file->getMimeType());

            $corners = $this->detectDocumentCorners($gdImage);

            if ($corners !== null) {
                $gdImage = $this->perspectiveCorrect($gdImage, $corners);
            } else {
                $gdImage = $this->cropToContent($gdImage);
            }

            $gdImage = $this->enhanceForReadability($gdImage);

            $gdImage = $this->resizeIfTooLarge($gdImage);

            $processedData = $this->encodeToJpeg($gdImage);
            imagedestroy($gdImage);

            if ($processedData === false) {
                throw ValidationException::withMessages([
                    'file' => ['فشل في معالجة الصورة.'],
                ]);
            }

            $dimensions = @getimagesizefromstring($processedData);
            $width = $dimensions ? $dimensions[0] : null;
            $height = $dimensions ? $dimensions[1] : null;

            $filename = 'scan-' . Str::random(12) . '.jpg';
            $asset = $this->storeAsset($tenant, $uploader, $processedData, $filename, strlen($processedData), $width, $height);

            DB::transaction(function () use ($question, $asset): void {
                $question->forceFill([
                    'media_asset_id' => $asset->id,
                    'question_format' => 'image',
                ])->save();
            });

            return $asset->refresh();
        } finally {
            if (file_exists($tempFile)) {
                @unlink($tempFile);
            }
        }
    }

    public function unlinkScan(Question $question): void
    {
        if ($question->media_asset_id === null) {
            return;
        }

        $asset = MediaAsset::find($question->media_asset_id);

        DB::transaction(function () use ($question, $asset): void {
            $question->forceFill([
                'media_asset_id' => null,
                'question_format' => 'text',
            ])->save();

            if ($asset) {
                $asset->forceFill(['status' => 'deleted'])->save();
                $asset->delete();
            }
        });
    }

    public function replaceScan(Tenant $tenant, TenantUser $uploader, Question $question, UploadedFile $file): MediaAsset
    {
        $this->unlinkScan($question);

        return $this->processScan($tenant, $uploader, $question, $file);
    }

    // ════════════════════════════════════════════════════════════
    //  Stage 1: Load & Auto-Orient
    // ════════════════════════════════════════════════════════════

    private function storeTempFile(UploadedFile $file): string
    {
        $filename = 'scan-' . Str::random(16) . '.' . ($file->getClientOriginalExtension() ?: 'jpg');
        $path = 'scan-temp/' . $filename;

        Storage::disk('local')->put($path, file_get_contents($file->getRealPath()));

        return Storage::disk('local')->path($path);
    }

    private function loadImageFromData(string $data, string $mimeType): \GdImage|false
    {
        return match ($mimeType) {
            'image/jpeg', 'image/png', 'image/webp' => @imagecreatefromstring($data),
            default => false,
        };
    }

    private function autoOrient(\GdImage $image, string $filePath, string $mimeType): \GdImage
    {
        if ($mimeType !== 'image/jpeg') {
            return $image;
        }

        $exif = @exif_read_data($filePath);
        if ($exif === false || ! isset($exif['Orientation'])) {
            return $image;
        }

        return match ($exif['Orientation']) {
            3 => $this->rotateImage($image, 180),
            6 => $this->rotateImage($image, 270),
            8 => $this->rotateImage($image, 90),
            default => $image,
        };
    }

    private function rotateImage(\GdImage $image, int $degrees): \GdImage
    {
        $rotated = @imagerotate($image, $degrees, 0);
        imagedestroy($image);

        return $rotated ?: $image;
    }

    // ════════════════════════════════════════════════════════════
    //  Stage 2: Document Border Detection
    // ════════════════════════════════════════════════════════════

    private function detectDocumentCorners(\GdImage $image): ?array
    {
        $origW = imagesx($image);
        $origH = imagesy($image);

        if ($origW < 50 || $origH < 50) {
            return null;
        }

        $scale = min(1.0, self::EDGE_SAMPLE_SIZE / max($origW, $origH));
        $smallW = max(1, (int) round($origW * $scale));
        $smallH = max(1, (int) round($origH * $scale));

        $small = imagecreatetruecolor($smallW, $smallH);
        imagecopyresampled($small, $image, 0, 0, 0, 0, $smallW, $smallH, $origW, $origH);

        $gray = $this->toGrayscale($small);
        imagedestroy($small);

        $blurred = $this->gaussianBlur3x3($gray);
        imagedestroy($gray);

        $edges = $this->sobelEdgeDetect($blurred);
        imagedestroy($blurred);

        $binary = $this->thresholdBinary($edges, self::EDGE_THRESHOLD);
        imagedestroy($edges);

        $edgePixels = $this->collectEdgePixels($binary, $smallW, $smallH);
        imagedestroy($binary);

        if (count($edgePixels) < 20) {
            return null;
        }

        $hull = $this->convexHull($edgePixels);

        if (count($hull) < 4) {
            return null;
        }

        $rect = $this->minBoundingRect($hull);

        if ($rect === null) {
            return null;
        }

        $rectArea = $this->quadArea($rect);
        $imageArea = $origW * $origH;
        if ($rectArea < $imageArea * 0.08) {
            return null;
        }

        $invScale = 1.0 / $scale;
        $corners = [];
        foreach ($rect as $pt) {
            $corners[] = [
                'x' => (int) round($pt['x'] * $invScale),
                'y' => (int) round($pt['y'] * $invScale),
            ];
        }

        foreach ($corners as &$c) {
            $c['x'] = max(0, min($origW - 1, $c['x']));
            $c['y'] = max(0, min($origH - 1, $c['y']));
        }
        unset($c);

        return $this->orderCorners($corners);
    }

    private function toGrayscale(\GdImage $image): \GdImage
    {
        $w = imagesx($image);
        $h = imagesy($image);
        $gray = imagecreatetruecolor($w, $h);

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $rgb = imagecolorat($image, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;
                $lum = (int) (0.299 * $r + 0.587 * $g + 0.114 * $b);
                $c = imagecolorallocate($gray, $lum, $lum, $lum);
                imagesetpixel($gray, $x, $y, $c);
            }
        }

        return $gray;
    }

    private function gaussianBlur3x3(\GdImage $image): \GdImage
    {
        $w = imagesx($image);
        $h = imagesy($image);
        $out = imagecreatetruecolor($w, $h);

        $kernel = [
            [1, 2, 1],
            [2, 4, 2],
            [1, 2, 1],
        ];
        $divisor = 16;

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $sum = 0;
                for ($ky = -1; $ky <= 1; $ky++) {
                    for ($kx = -1; $kx <= 1; $kx++) {
                        $px = min($w - 1, max(0, $x + $kx));
                        $py = min($h - 1, max(0, $y + $ky));
                        $sum += (imagecolorat($image, $px, $py) & 0xFF) * $kernel[$ky + 1][$kx + 1];
                    }
                }
                $val = (int) ($sum / $divisor);
                $c = imagecolorallocate($out, $val, $val, $val);
                imagesetpixel($out, $x, $y, $c);
            }
        }

        return $out;
    }

    private function sobelEdgeDetect(\GdImage $image): \GdImage
    {
        $w = imagesx($image);
        $h = imagesy($image);
        $out = imagecreatetruecolor($w, $h);

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $gx = 0;
                $gy = 0;

                for ($ky = -1; $ky <= 1; $ky++) {
                    for ($kx = -1; $kx <= 1; $kx++) {
                        $px = min($w - 1, max(0, $x + $kx));
                        $py = min($h - 1, max(0, $y + $ky));
                        $val = imagecolorat($image, $px, $py) & 0xFF;

                        $sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
                        $sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
                        $idx = ($ky + 1) * 3 + ($kx + 1);
                        $gx += $val * $sobelX[$idx];
                        $gy += $val * $sobelY[$idx];
                    }
                }

                $mag = min(255, (int) sqrt($gx * $gx + $gy * $gy));
                $c = imagecolorallocate($out, $mag, $mag, $mag);
                imagesetpixel($out, $x, $y, $c);
            }
        }

        return $out;
    }

    private function thresholdBinary(\GdImage $image, int $threshold): \GdImage
    {
        $w = imagesx($image);
        $h = imagesy($image);
        $out = imagecreatetruecolor($w, $h);
        $white = imagecolorallocate($out, 255, 255, 255);
        $black = imagecolorallocate($out, 0, 0, 0);

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $val = imagecolorat($image, $x, $y) & 0xFF;
                imagesetpixel($out, $x, $y, $val > $threshold ? $white : $black);
            }
        }

        return $out;
    }

    private function collectEdgePixels(\GdImage $binary, int $w, int $h): array
    {
        $pixels = [];
        $step = max(1, (int) floor(min($w, $h) / 100));

        for ($y = 0; $y < $h; $y += $step) {
            for ($x = 0; $x < $w; $x += $step) {
                if ((imagecolorat($binary, $x, $y) & 0xFF) > 128) {
                    $pixels[] = ['x' => $x, 'y' => $y];
                }
            }
        }

        return $pixels;
    }

    private function convexHull(array $points): array
    {
        $n = count($points);
        if ($n < 3) {
            return $points;
        }

        usort($points, function ($a, $b) {
            return $a['x'] <=> $b['x'] ?: $a['y'] <=> $b['y'];
        });

        $lower = [];
        foreach ($points as $p) {
            while (count($lower) >= 2 && $this->cross(end($lower), $lower[count($lower) - 2], $p) <= 0) {
                array_pop($lower);
            }
            $lower[] = $p;
        }

        $upper = [];
        for ($i = count($points) - 1; $i >= 0; $i--) {
            $p = $points[$i];
            while (count($upper) >= 2 && $this->cross(end($upper), $upper[count($upper) - 2], $p) <= 0) {
                array_pop($upper);
            }
            $upper[] = $p;
        }

        array_pop($lower);
        array_pop($upper);

        return array_merge($lower, $upper);
    }

    private function cross(array $o, array $a, array $b): int
    {
        return ($a['x'] - $o['x']) * ($b['y'] - $o['y']) - ($a['y'] - $o['y']) * ($b['x'] - $o['x']);
    }

    private function minBoundingRect(array $hull): ?array
    {
        $n = count($hull);
        if ($n < 3) {
            return null;
        }

        $minArea = PHP_INT_MAX;
        $bestRect = null;

        for ($i = 0; $i < $n; $i++) {
            $j = ($i + 1) % $n;
            $edgeX = $hull[$j]['x'] - $hull[$i]['x'];
            $edgeY = $hull[$j]['y'] - $hull[$i]['y'];
            $edgeLen = sqrt($edgeX * $edgeX + $edgeY * $edgeY);

            if ($edgeLen < 0.001) {
                continue;
            }

            $cos = $edgeX / $edgeLen;
            $sin = $edgeY / $edgeLen;

            $minU = PHP_INT_MAX;
            $maxU = PHP_INT_MIN;
            $minV = PHP_INT_MAX;
            $maxV = PHP_INT_MIN;

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

                $corners = [
                    ['x' => $minU * $cos - $minV * $sin, 'y' => $minU * $sin + $minV * $cos],
                    ['x' => $maxU * $cos - $minV * $sin, 'y' => $maxU * $sin + $minV * $cos],
                    ['x' => $maxU * $cos - $maxV * $sin, 'y' => $maxU * $sin + $maxV * $cos],
                    ['x' => $minU * $cos - $maxV * $sin, 'y' => $minU * $sin + $maxV * $cos],
                ];

                $bestRect = $corners;
            }
        }

        return $bestRect;
    }

    private function orderCorners(array $corners): array
    {
        $cx = array_sum(array_column($corners, 'x')) / count($corners);
        $cy = array_sum(array_column($corners, 'y')) / count($corners);

        $tl = $tr = $br = $bl = null;
        $tlScore = PHP_INT_MAX;
        $trScore = PHP_INT_MIN;
        $brScore = PHP_INT_MAX;
        $blScore = PHP_INT_MIN;

        foreach ($corners as $pt) {
            $score = ($pt['x'] - $cx) + ($pt['y'] - $cy);
            if ($score < $tlScore) {
                $tlScore = $score;
                $tl = $pt;
            }
            $score2 = ($pt['x'] - $cx) - ($pt['y'] - $cy);
            if ($score2 > $trScore) {
                $trScore = $score2;
                $tr = $pt;
            }
        }

        foreach ($corners as $pt) {
            if ($pt === $tl || $pt === $tr) {
                continue;
            }
            if ($bl === null || $pt['y'] > $bl['y'] || ($pt['y'] == $bl['y'] && $pt['x'] < $bl['x'])) {
                $bl = $pt;
            }
        }

        foreach ($corners as $pt) {
            if ($pt === $tl || $pt === $tr || $pt === $bl) {
                continue;
            }
            $br = $pt;
        }

        if ($tl === null || $tr === null || $br === null || $bl === null) {
            usort($corners, fn($a, $b) => $a['x'] <=> $b['x']);
            $left = array_slice($corners, 0, 2);
            $right = array_slice($corners, 2);
            usort($left, fn($a, $b) => $a['y'] <=> $b['y']);
            usort($right, fn($a, $b) => $a['y'] <=> $b['y']);

            return [$left[0], $right[0], $right[1], $left[1]];
        }

        return [$tl, $tr, $br, $bl];
    }

    private function quadArea(array $corners): float
    {
        $n = count($corners);
        $area = 0.0;
        for ($i = 0; $i < $n; $i++) {
            $j = ($i + 1) % $n;
            $area += $corners[$i]['x'] * $corners[$j]['y'];
            $area -= $corners[$j]['x'] * $corners[$i]['y'];
        }

        return abs($area) / 2.0;
    }

    // ════════════════════════════════════════════════════════════
    //  Stage 3: Perspective Correction
    // ════════════════════════════════════════════════════════════

    private function perspectiveCorrect(\GdImage $image, array $srcCorners): \GdImage
    {
        $srcW = imagesx($image);
        $srcH = imagesy($image);

        $topW = (int) round(hypot(
            $srcCorners[1]['x'] - $srcCorners[0]['x'],
            $srcCorners[1]['y'] - $srcCorners[0]['y']
        ));
        $botW = (int) round(hypot(
            $srcCorners[2]['x'] - $srcCorners[3]['x'],
            $srcCorners[2]['y'] - $srcCorners[3]['y']
        ));
        $leftH = (int) round(hypot(
            $srcCorners[3]['x'] - $srcCorners[0]['x'],
            $srcCorners[3]['y'] - $srcCorners[0]['y']
        ));
        $rightH = (int) round(hypot(
            $srcCorners[2]['x'] - $srcCorners[1]['x'],
            $srcCorners[2]['y'] - $srcCorners[1]['y']
        ));

        $dstW = max($topW, $botW);
        $dstH = max($leftH, $rightH);

        if ($dstW < 10 || $dstH < 10 || $dstW > self::MAX_DIMENSION * 2 || $dstH > self::MAX_DIMENSION * 2) {
            return $image;
        }

        $dstCorners = [
            ['x' => 0, 'y' => 0],
            ['x' => $dstW, 'y' => 0],
            ['x' => $dstW, 'y' => $dstH],
            ['x' => 0, 'y' => $dstH],
        ];

        $homography = $this->computeHomography($dstCorners, $srcCorners);

        if ($homography === null) {
            return $this->cropToContent($image);
        }

        $result = $this->warpPerspective($image, $homography, $dstW, $dstH);
        imagedestroy($image);

        return $result;
    }

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

        return [
            $solution[0], $solution[1], $solution[2],
            $solution[3], $solution[4], $solution[5],
            $solution[6], $solution[7], 1.0,
        ];
    }

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

    private function warpPerspective(\GdImage $src, array $h, int $dstW, int $dstH): \GdImage
    {
        $srcW = imagesx($src);
        $srcH = imagesy($src);
        $dst = imagecreatetruecolor($dstW, $dstH);

        $bg = imagecolorallocate($dst, 255, 255, 255);
        imagefill($dst, 0, 0, $bg);

        $h00 = $h[0]; $h01 = $h[1]; $h02 = $h[2];
        $h10 = $h[3]; $h11 = $h[4]; $h12 = $h[5];
        $h20 = $h[6]; $h21 = $h[7];

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

                $c = imagecolorallocate($dst, min(255, $r), min(255, $g), min(255, $b));
                imagesetpixel($dst, $dx, $dy, $c);
            }
        }

        return $dst;
    }

    // ════════════════════════════════════════════════════════════
    //  Fallback: Simple Crop to Content
    // ════════════════════════════════════════════════════════════

    private function cropToContent(\GdImage $image): \GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);

        if ($width === false || $height === false) {
            return $image;
        }

        $bounds = $this->findContentBounds($image, $width, $height);

        if ($bounds === null) {
            return $image;
        }

        $cropX = max(0, $bounds['left'] - self::CONTENT_MARGIN_PX);
        $cropY = max(0, $bounds['top'] - self::CONTENT_MARGIN_PX);
        $cropWidth = min($width - $cropX, $bounds['right'] - $bounds['left'] + self::CONTENT_MARGIN_PX * 2);
        $cropHeight = min($height - $cropY, $bounds['bottom'] - $bounds['top'] + self::CONTENT_MARGIN_PX * 2);

        if ($cropWidth < 1 || $cropHeight < 1) {
            return $image;
        }

        if ($cropX === 0 && $cropY === 0 && $cropWidth === $width && $cropHeight === $height) {
            return $image;
        }

        $cropped = imagecreatetruecolor($cropWidth, $cropHeight);
        if ($cropped === false) {
            return $image;
        }

        imagecopy($cropped, $image, 0, 0, $cropX, $cropY, $cropWidth, $cropHeight);
        imagedestroy($image);

        return $cropped;
    }

    private function findContentBounds(\GdImage $image, int $width, int $height): ?array
    {
        $top = null;
        $bottom = null;
        $left = null;
        $right = null;

        $step = max(1, (int) floor(min($width, $height) / 200));

        for ($y = 0; $y < $height; $y += $step) {
            for ($x = 0; $x < $width; $x += $step) {
                $rgb = imagecolorat($image, $x, $y);
                if ($rgb === false) {
                    continue;
                }

                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;

                $brightness = (int) (($r * 0.299) + ($g * 0.587) + ($b * 0.114));

                if ($brightness < self::WHITE_THRESHOLD) {
                    if ($top === null || $y < $top) {
                        $top = $y;
                    }
                    if ($bottom === null || $y > $bottom) {
                        $bottom = $y;
                    }
                    if ($left === null || $x < $left) {
                        $left = $x;
                    }
                    if ($right === null || $x > $right) {
                        $right = $x;
                    }
                }
            }
        }

        if ($top === null || $bottom === null || $left === null || $right === null) {
            return null;
        }

        return [
            'top' => $top,
            'bottom' => $bottom,
            'left' => $left,
            'right' => $right,
        ];
    }

    // ════════════════════════════════════════════════════════════
    //  Stage 4: Enhancement
    // ════════════════════════════════════════════════════════════

    private function enhanceForReadability(\GdImage $image): \GdImage
    {
        $image = $this->unsharpMask($image, 1.5, 1);
        $image = $this->normalizeContrast($image);
        $image = $this->medianFilter3x3($image);

        return $image;
    }

    private function unsharpMask(\GdImage $image, float $amount, int $radius): \GdImage
    {
        $w = imagesx($image);
        $h = imagesy($image);

        $blurred = imagecreatetruecolor($w, $h);
        imagecopy($blurred, $image, 0, 0, 0, 0, $w, $h);

        for ($i = 0; $i < $radius; $i++) {
            $tmp = $this->gaussianBlur3x3($blurred);
            imagedestroy($blurred);
            $blurred = $tmp;
        }

        $out = imagecreatetruecolor($w, $h);

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $orig = imagecolorat($image, $x, $y);
                $blur = imagecolorat($blurred, $x, $y);

                $or = ($orig >> 16) & 0xFF;
                $og = ($orig >> 8) & 0xFF;
                $ob = $orig & 0xFF;

                $br = ($blur >> 16) & 0xFF;
                $bg = ($blur >> 8) & 0xFF;
                $bb = $blur & 0xFF;

                $r = (int) min(255, max(0, $or + $amount * ($or - $br)));
                $g = (int) min(255, max(0, $og + $amount * ($og - $bg)));
                $b = (int) min(255, max(0, $ob + $amount * ($ob - $bb)));

                $c = imagecolorallocate($out, $r, $g, $b);
                imagesetpixel($out, $x, $y, $c);
            }
        }

        imagedestroy($blurred);
        imagedestroy($image);

        return $out;
    }

    private function normalizeContrast(\GdImage $image): \GdImage
    {
        $w = imagesx($image);
        $h = imagesy($image);
        $total = $w * $h;

        $histR = array_fill(0, 256, 0);
        $histG = array_fill(0, 256, 0);
        $histB = array_fill(0, 256, 0);

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $rgb = imagecolorat($image, $x, $y);
                $histR[($rgb >> 16) & 0xFF]++;
                $histG[($rgb >> 8) & 0xFF]++;
                $histB[$rgb & 0xFF]++;
            }
        }

        $lowPct = (int) ($total * 0.005);
        $highPct = (int) ($total * 0.995);

        $lutR = $this->buildContrastLut($histR, $lowPct, $highPct);
        $lutG = $this->buildContrastLut($histG, $lowPct, $highPct);
        $lutB = $this->buildContrastLut($histB, $lowPct, $highPct);

        $out = imagecreatetruecolor($w, $h);

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $rgb = imagecolorat($image, $x, $y);
                $r = $lutR[($rgb >> 16) & 0xFF];
                $g = $lutG[($rgb >> 8) & 0xFF];
                $b = $lutB[$rgb & 0xFF];
                $c = imagecolorallocate($out, $r, $g, $b);
                imagesetpixel($out, $x, $y, $c);
            }
        }

        imagedestroy($image);

        return $out;
    }

    private function buildContrastLut(array $hist, int $low, int $high): array
    {
        $lut = [];
        $cum = 0;
        $range = max(1, $high - $low);

        for ($i = 0; $i < 256; $i++) {
            $cum += $hist[$i];
            if ($cum <= $low) {
                $lut[$i] = 0;
            } elseif ($cum >= $high) {
                $lut[$i] = 255;
            } else {
                $lut[$i] = (int) min(255, max(0, round(($cum - $low) / $range * 255)));
            }
        }

        return $lut;
    }

    private function medianFilter3x3(\GdImage $image): \GdImage
    {
        $w = imagesx($image);
        $h = imagesy($image);
        $out = imagecreatetruecolor($w, $h);

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $neighbors = [];

                for ($ky = -1; $ky <= 1; $ky++) {
                    for ($kx = -1; $kx <= 1; $kx++) {
                        $px = min($w - 1, max(0, $x + $kx));
                        $py = min($h - 1, max(0, $y + $ky));
                        $neighbors[] = imagecolorat($image, $px, $py);
                    }
                }

                $rs = array_map(fn($c) => ($c >> 16) & 0xFF, $neighbors);
                $gs = array_map(fn($c) => ($c >> 8) & 0xFF, $neighbors);
                $bs = array_map(fn($c) => $c & 0xFF, $neighbors);

                sort($rs);
                sort($gs);
                sort($bs);

                $c = imagecolorallocate($out, $rs[4], $gs[4], $bs[4]);
                imagesetpixel($out, $x, $y, $c);
            }
        }

        imagedestroy($image);

        return $out;
    }

    // ════════════════════════════════════════════════════════════
    //  Stage 5: Resize & Encode
    // ════════════════════════════════════════════════════════════

    private function resizeIfTooLarge(\GdImage $image): \GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);

        if ($width <= self::MAX_DIMENSION && $height <= self::MAX_DIMENSION) {
            return $image;
        }

        if ($width >= $height) {
            $newWidth = self::MAX_DIMENSION;
            $newHeight = (int) round($height * (self::MAX_DIMENSION / $width));
        } else {
            $newHeight = self::MAX_DIMENSION;
            $newWidth = (int) round($width * (self::MAX_DIMENSION / $height));
        }

        if ($newWidth < 1 || $newHeight < 1) {
            return $image;
        }

        $resized = imagecreatetruecolor($newWidth, $newHeight);
        if ($resized === false) {
            return $image;
        }

        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($image);

        return $resized;
    }

    private function encodeToJpeg(\GdImage $image): string|false
    {
        ob_start();
        $success = imagejpeg($image, null, self::JPEG_QUALITY);
        $data = ob_get_clean();

        if (! $success || $data === false) {
            return false;
        }

        return $data;
    }

    // ════════════════════════════════════════════════════════════
    //  Storage
    // ════════════════════════════════════════════════════════════

    private function storeAsset(Tenant $tenant, TenantUser $uploader, string $imageData, string $filename, int $sizeBytes, ?int $width, ?int $height): MediaAsset
    {
        $integration = \App\Models\TenantIntegration::query()
            ->where('tenant_id', $tenant->id)
            ->where('provider', 'bunny')
            ->where('service', 'storage')
            ->whereIn('status', ['pending', 'active'])
            ->first();
        $config = $integration?->config ?? [];

        $platform = \App\Models\PlatformBunnySetting::active();
        if ($platform && $platform->hasStorageCredentials()
            && (empty($config['upload_base_url']) || empty($config['client_upload_key']))) {
            $config = array_merge($platform->toProviderConfig('storage'), $config);
        }

        $cdnBaseUrl = rtrim((string) ($config['cdn_base_url'] ?? ''), '/');
        $accessKey = $config['client_upload_key'] ?? $config['password'] ?? null;
        $bunnyReady = $integration && $accessKey && ! empty($cdnBaseUrl);

        $storageKey = $this->pathGenerator->generate($tenant, 'assets', $filename);

        if ($bunnyReady) {
            $uploadBase = rtrim((string) ($config['upload_base_url'] ?? ''), '/');
            $uploadUrl = "{$uploadBase}/{$storageKey}";

            $response = Http::withHeaders(array_filter([
                'AccessKey' => $accessKey,
                'Content-Type' => 'image/jpeg',
            ]))->withBody($imageData, 'image/jpeg')
                ->put($uploadUrl);

            if (! $response->successful()) {
                throw ValidationException::withMessages([
                    'file' => ['فشل في رفع الصورة إلى التخزين.'],
                ]);
            }

            $cdnUrl = "{$cdnBaseUrl}/{$storageKey}";

            return $this->mediaLibrary->createAsset($tenant, [
                'provider' => 'bunny',
                'provider_service' => 'storage',
                'type' => 'image',
                'status' => 'ready',
                'visibility' => 'private',
                'storage_key' => $storageKey,
                'original_filename' => $filename,
                'mime_type' => 'image/jpeg',
                'size_bytes' => $sizeBytes,
                'cdn_url' => $cdnUrl,
                'width' => $width,
                'height' => $height,
                'metadata' => [
                    'storage_root' => 'assets',
                    'scan_processed' => true,
                ],
            ], $uploader);
        }

        $localPath = "assets/" . basename($storageKey);
        Storage::disk('public')->put($localPath, $imageData);
        $cdnUrl = Storage::disk('public')->url($localPath);

        return $this->mediaLibrary->createAsset($tenant, [
            'provider' => 'local',
            'provider_service' => 'storage',
            'type' => 'image',
            'status' => 'ready',
            'visibility' => 'private',
            'storage_key' => $storageKey,
            'original_filename' => $filename,
            'mime_type' => 'image/jpeg',
            'size_bytes' => $sizeBytes,
            'cdn_url' => $cdnUrl,
            'width' => $width,
            'height' => $height,
            'metadata' => [
                'storage_root' => 'assets',
                'scan_processed' => true,
                'local' => true,
            ],
        ], $uploader);
    }
}
