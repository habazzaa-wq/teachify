<?php

namespace App\Services\ExamBank\Import;

use InvalidArgumentException;

/**
 * Pixel-level page analysis used for layout understanding.
 *
 * Decodes an uploaded photo, flattens transparency, applies EXIF orientation,
 * then produces an ink mask (adaptive threshold against the estimated paper
 * brightness) and connected-component bounding boxes. Components feed the
 * layout builder which separates graphic regions (diagrams/shapes) from text.
 *
 * Analysis runs on a downscaled copy (config question-import.analysis.max_side)
 * purely for geometry — OCR itself works on the original resolution.
 */
final class PageAnalyzer
{
    public const MAX_SIDE_DEFAULT = 1400;

    public int $maxSide;

    public function __construct()
    {
        $this->maxSide = max(400, (int) config('question-import.analysis.max_side', self::MAX_SIDE_DEFAULT));
    }

    /**
     * A rectangular connected component on the analysis grid.
     *
     * @return array{x: int, y: int, w: int, h: int, ink: int, fill: float}
     */
    public static function component(int $x, int $y, int $w, int $h, int $ink): array
    {
        return [
            'x' => $x,
            'y' => $y,
            'w' => $w,
            'h' => $h,
            'ink' => $ink,
            'fill' => ($w * $h) > 0 ? $ink / ($w * $h) : 0.0,
        ];
    }

    /**
     * @return array{image: \GdImage, scale: float, width: int, height: int}
     */
    public function decodeToAnalysisScale(string $bytes, ?int $exifOrientation = null): array
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

        if ($this->hasAlpha($src)) {
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

        $w = imagesx($src);
        $h = imagesy($src);

        if ($w <= $this->maxSide && $h <= $this->maxSide) {
            return ['image' => $src, 'scale' => 1.0, 'width' => $w, 'height' => $h];
        }

        $scale = $this->maxSide / max($w, $h);
        $nw = max(1, (int) round($w * $scale));
        $nh = max(1, (int) round($h * $scale));

        $small = imagecreatetruecolor($nw, $nh);
        imagefill($small, 0, 0, imagecolorallocate($small, 255, 255, 255));
        imagecopyresampled($small, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
        imagedestroy($src);

        return ['image' => $small, 'scale' => $nw / $w, 'width' => $nw, 'height' => $nh];
    }

    /**
     * Binarizes against estimated paper brightness and extracts connected
     * components of ink.
     *
     * @param  \GdImage  $image  analysis-scale grayscale-capable true color image
     * @return list<array{x: int, y: int, w: int, h: int, ink: int, fill: float}>
     */
    public function findInkComponents(\GdImage $image): array
    {
        $w = imagesx($image);
        $h = imagesy($image);

        // Estimate paper level: dominant bright bin of the histogram.
        $hist = array_fill(0, 256, 0);
        $gray = [];
        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $rgb = imagecolorat($image, $x, $y);
                $l = (int) (0.299 * (($rgb >> 16) & 0xFF) + 0.587 * (($rgb >> 8) & 0xFF) + 0.114 * ($rgb & 0xFF));
                $gray[$y][$x] = $l;
                $hist[$l]++;
            }
        }

        $total = $w * $h;
        $paper = 230;
        $acc = 0;
        for ($i = 255; $i >= 0; $i--) {
            $acc += $hist[$i];
            if ($acc >= (int) ($total * 0.06)) {
                $paper = $i;
                break;
            }
        }

        $threshold = max(70, min(220, $paper - 62));

        $mask = [];
        for ($y = 0; $y < $h; $y++) {
            $row = [];
            for ($x = 0; $x < $w; $x++) {
                $row[$x] = $gray[$y][$x] < $threshold ? 1 : 0;
            }
            $mask[$y] = $row;
        }

        return $this->labelComponents($mask, $w, $h);
    }

    /**
     * Iterative flood-fill labeling of ink pixels (4-connectivity).
     *
     * @param  array<int, array<int, int>>  $mask
     * @return list<array{x: int, y: int, w: int, h: int, ink: int, fill: float}>
     */
    private function labelComponents(array $mask, int $w, int $h): array
    {
        $visited = [];
        for ($y = 0; $y < $h; $y++) {
            $visited[$y] = array_fill(0, $w, false);
        }

        $components = [];
        $minPixels = max(4, (int) round(min($w, $h) / 200));

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                if ($mask[$y][$x] === 0 || $visited[$y][$x]) {
                    continue;
                }

                $stack = [[$x, $y]];
                $visited[$y][$x] = true;

                $minX = $maxX = $x;
                $minY = $maxY = $y;
                $ink = 0;

                while ($stack !== []) {
                    [$cx, $cy] = array_pop($stack);
                    $ink++;

                    if ($cx < $minX) { $minX = $cx; }
                    if ($cx > $maxX) { $maxX = $cx; }
                    if ($cy < $minY) { $minY = $cy; }
                    if ($cy > $maxY) { $maxY = $cy; }

                    foreach ([[1, 0], [-1, 0], [0, 1], [0, -1]] as [$dx, $dy]) {
                        $nx = $cx + $dx;
                        $ny = $cy + $dy;
                        if ($nx < 0 || $ny < 0 || $nx >= $w || $ny >= $h || $mask[$ny][$nx] === 0 || $visited[$ny][$nx]) {
                            continue;
                        }
                        $visited[$ny][$nx] = true;
                        $stack[] = [$nx, $ny];
                    }
                }

                if ($ink >= $minPixels) {
                    $components[] = self::component($minX, $minY, $maxX - $minX + 1, $maxY - $minY + 1, $ink);
                }
            }
        }

        usort($components, fn (array $a, array $b): int => [$a['y'], $a['x']] <=> [$b['y'], $b['x']]);

        return $components;
    }

    private function hasAlpha(\GdImage $img): bool
    {
        $w = imagesx($img);
        $h = imagesy($img);
        $step = max(1, (int) floor(min($w, $h) / 96));
        for ($y = 0; $y < $h; $y += $step) {
            for ($x = 0; $x < $w; $x += $step) {
                if ((($rgb = imagecolorat($img, $x, $y)) >> 24) & 0x7F) {
                    return true;
                }
            }
        }

        return false;
    }
}
