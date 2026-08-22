<?php

namespace App\Services\ExamBank\Import;

use App\Services\ExamBank\Import\Ocr\OcrWord;
use App\Services\ExamBank\Import\Svg\SvgSanitizer;

/**
 * Attempts to reconstruct detected graphic regions as structured SVG.
 *
 * Honest by design: only simple geometric content is classified
 * (circle/ellipse, triangle, quadrilateral, line/arrow, coordinate axes) and
 * every reconstruction carries a confidence score. Regions below the
 * confidence floor are returned as `unresolved_visual` blocks — the teacher
 * review workspace shows them explicitly and lets the teacher redraw or drop
 * them. Complex artwork is never silently replaced with wrong shapes.
 */
final class DiagramReconstructor
{
    private const MIN_CONFIDENCE = 0.55;

    public function __construct(
        private readonly SvgSanitizer $sanitizer,
    ) {}

    /**
     * Rebuilds one graphic region.
     *
     * @param  \GdImage  $image  analysis-scale image (for contour sampling)
     * @param  array{x: int, y: int, w: int, h: int}  $region      original-scale region box
     * @param  float  $analysisScale  analysis px per original px
     * @param  list<OcrWord>  $words       all OCR words (original scale) for labels
     * @return array<string, mixed> diagram or unresolved_visual block draft
     */
    public function reconstruct(\GdImage $image, array $region, float $analysisScale, array $words): array
    {
        $ax = (int) round($region['x'] * $analysisScale);
        $ay = (int) round($region['y'] * $analysisScale);
        $aw = max(4, (int) round($region['w'] * $analysisScale));
        $ah = max(4, (int) round($region['h'] * $analysisScale));

        // Extract region mask at analysis resolution.
        $mask = [];
        $inkCount = 0;
        for ($y = $ay; $y < min(imagesy($image), $ay + $ah); $y++) {
            for ($x = $ax; $x < min(imagesx($image), $ax + $aw); $x++) {
                $rgb = imagecolorat($image, $x, $y);
                $l = 0.299 * (($rgb >> 16) & 0xFF) + 0.587 * (($rgb >> 8) & 0xFF) + 0.114 * ($rgb & 0xFF);
                $ink = $l < 128 ? 1 : 0;
                $mask[$y - $ay][$x - $ax] = $ink;
                $inkCount += $ink;
            }
        }

        if ($inkCount < 12) {
            return $this->unresolved($region, 'empty_region');
        }

        $shape = $this->classifyShape($mask, $aw, $ah);

        if ($shape === null || $shape['confidence'] < self::MIN_CONFIDENCE) {
            return $this->unresolved($region, 'complex_or_unclear_diagram');
        }

        // Collect labels: OCR words whose centers fall inside the region.
        $labels = [];
        foreach ($words as $word) {
            $cx = $word->x + $word->width / 2;
            $cy = $word->y + $word->height / 2;
            if ($cx >= $region['x'] && $cx <= $region['x'] + $region['w']
                && $cy >= $region['y'] && $cy <= $region['y'] + $region['h']) {
                $labels[] = [
                    'text' => $word->text,
                    'x' => (int) round($cx - $region['x']),
                    'y' => (int) round($cy - $region['y']),
                    'confidence' => ($word->confidence ?? 50) / 100,
                ];
            }
        }

        $svg = $this->renderSvg($shape, $labels, $region['w'], $region['h']);
        $svg = $this->sanitizer->sanitize($svg);

        if ($svg === null) {
            return $this->unresolved($region, 'svg_generation_failed');
        }

        return [
            'type' => 'diagram',
            'format' => 'svg',
            'svg' => $svg,
            'shapes' => [$shape['kind']],
            'labels' => $labels,
            'confidence' => round(min($shape['confidence'], count($labels) > 0 ? collect($labels)->avg('confidence') : 1.0), 3),
        ];
    }

    /**
     * Classifies the dominant ink shape inside a mask.
     *
     * @param  array<int, array<int, int>>  $mask
     * @return array{kind: string, confidence: float, params: array<string, mixed>}|null
     */
    private function classifyShape(array $mask, int $w, int $h): ?array
    {
        $boundary = $this->traceBoundaryPoints($mask, $w, $h);

        if (count($boundary) < 8) {
            return null;
        }

        $perimeter = $this->polygonPerimeter($boundary);
        $area = $this->polygonArea($boundary);
        $aspect = max(0.0001, $h / max(1, $w));

        if ($area <= 0 || $perimeter <= 0) {
            return null;
        }

        // Thin structures → lines / axes.
        $fillRatio = $this->inkInsidePolygonRatio($mask, $boundary, $area);
        $isThin = $aspect > 6.5 || $aspect < 0.154 || $area / ($w * $h) < 0.02;

        if ($isThin) {
            return $this->classifyThinStructure($mask, $w, $h, $boundary);
        }

        // Polygonal corner estimation via angle deviation walk.
        $corners = $this->countCorners($boundary);
        $circularity = (4 * M_PI * $area) / ($perimeter * $perimeter); // 1.0 for a circle

        if ($circularity >= 0.72 && $corners <= 5) {
            $cx = $w / 2;
            $cy = $h / 2;
            $radiusX = $w / 2;
            $radiusY = $h / 2;
            $ellipseScore = min($aspect, 1 / $aspect);
            $confidence = 0.55 + 0.30 * min(1.0, ($circularity - 0.72) / 0.26) + 0.10 * $ellipseScore;

            return [
                'kind' => $aspect > 1.25 || $aspect < 0.8 ? 'ellipse' : 'circle',
                'confidence' => min(0.92, $confidence),
                'params' => [
                    'cx' => round($cx, 1),
                    'cy' => round($cy, 1),
                    'rx' => round($radiusX, 1),
                    'ry' => round($radiusY, 1),
                ],
            ];
        }

        if ($corners === 3) {
            return [
                'kind' => 'triangle',
                'confidence' => 0.62,
                'params' => [
                    'points' => $this->principalCorners($boundary, 3),
                ],
            ];
        }

        if ($corners === 4) {
            $quad = $this->principalCorners($boundary, 4);
            $rightAngles = $this->quadrilateralRightness($quad);

            return [
                'kind' => $rightAngles >= 0.82 && $aspect > 0.7 && $aspect < 1.43 ? 'square' : 'rectangle',
                'confidence' => 0.60 + 0.20 * $rightAngles,
                'params' => [
                    'points' => $quad,
                ],
            ];
        }

        return null; // complex artwork → unresolved, teacher decides
    }

    /**
     * Lines and axis systems: one long stroke, or two perpendicular strokes.
     *
     * @param  array<int, array<int, int>>  $mask
     * @param  list<array{x: float, y: float}>  $boundary
     * @return array{kind: string, confidence: float, params: array<string, mixed>}|null
     */
    private function classifyThinStructure(array $mask, int $w, int $h, array $boundary): ?array
    {
        // Horizontal projection of ink to find strokes.
        $rowInk = array_fill(0, $h, 0);
        $colInk = array_fill(0, $w, 0);

        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                if (($mask[$y][$x] ?? 0) === 1) {
                    $rowInk[$y]++;
                    $colInk[$x]++;
                }
            }
        }

        $strongRows = array_keys(array_filter($rowInk, fn (int $v): bool => $v > $w * 0.45));
        $strongCols = array_keys(array_filter($colInk, fn (int $v): bool => $v > $h * 0.45));

        if (count($strongRows) >= 1 && count($strongCols) >= 1) {
            return [
                'kind' => 'axes',
                'confidence' => 0.66,
                'params' => [
                    'originX' => (int) (end($strongCols) ?: 0),
                    'originY' => (int) (end($strongRows) ?: 0),
                    'width' => $w,
                    'height' => $h,
                ],
            ];
        }

        if (count($strongRows) === 1) {
            $y = $strongRows[0];

            return [
                'kind' => 'line',
                'confidence' => 0.68,
                'params' => ['x1' => 2, 'y1' => $y, 'x2' => $w - 2, 'y2' => $y],
            ];
        }

        if (count($strongCols) === 1) {
            $x = $strongCols[0];

            return [
                'kind' => 'line',
                'confidence' => 0.68,
                'params' => ['x1' => $x, 'y1' => 2, 'x2' => $x, 'y2' => $h - 2],
            ];
        }

        // Diagonal single stroke between extreme boundary points.
        $first = $boundary[0];
        $farthest = $boundary[0];
        $bestDistance = 0.0;
        foreach ($boundary as $point) {
            $distance = hypot($point['x'] - $first['x'], $point['y'] - $first['y']);
            if ($distance > $bestDistance) {
                $bestDistance = $distance;
                $farthest = $point;
            }
        }

        if ($bestDistance > 0.75 * max($w, $h)) {
            return [
                'kind' => 'line',
                'confidence' => 0.56,
                'params' => [
                    'x1' => round($first['x'], 1),
                    'y1' => round($first['y'], 1),
                    'x2' => round($farthest['x'], 1),
                    'y2' => round($farthest['y'], 1),
                ],
            ];
        }

        return null;
    }

    /**
     * Boundary walk of the largest ink component (Moore-neighbor tracing on a
     * coarse grid). Returns up to ~200 points.
     *
     * @param  array<int, array<int, int>>  $mask
     * @return list<array{x: float, y: float}>
     */
    private function traceBoundaryPoints(array $mask, int $w, int $h): array
    {
        // Find first ink pixel (top-left scan).
        $start = null;
        for ($y = 0; $y < $h && $start === null; $y++) {
            for ($x = 0; $x < $w; $x++) {
                if (($mask[$y][$x] ?? 0) === 1) {
                    $start = [$x, $y];
                    break;
                }
            }
        }

        if ($start === null) {
            return [];
        }

        $directions = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
        $points = [[$start[0], $start[1]]];
        $current = $start;
        $dir = 7; // start scanning upward-left neighborhood

        $limit = $w * $h;
        $steps = 0;

        while ($steps++ < $limit) {
            $found = false;
            for ($i = 0; $i < 8; $i++) {
                $candidateDir = ($dir + $i) % 8;
                $nx = $current[0] + $directions[$candidateDir][0];
                $ny = $current[1] + $directions[$candidateDir][1];

                if ($nx >= 0 && $ny >= 0 && $nx < $w && $ny < $h && ($mask[$ny][$nx] ?? 0) === 1) {
                    $current = [$nx, $ny];
                    $points[] = [$nx, $ny];
                    $dir = ($candidateDir + 5) % 8; // rotate back
                    $found = true;
                    break;
                }
            }

            if (! $found) {
                break;
            }

            if ($steps > 12 && $current[0] === $start[0] && $current[1] === $start[1]) {
                break;
            }

            if (count($points) >= 400) {
                break;
            }
        }

        // Downsample boundary points.
        $step = max(1, intdiv(count($points), 200));

        $sampled = [];
        for ($i = 0; $i < count($points); $i += $step) {
            $sampled[] = ['x' => (float) $points[$i][0], 'y' => (float) $points[$i][1]];
        }

        return $sampled;
    }

    /** @param list<array{x: float, y: float}> $points */
    private function polygonPerimeter(array $points): float
    {
        $perimeter = 0.0;
        $n = count($points);

        for ($i = 0; $i < $n; $i++) {
            $a = $points[$i];
            $b = $points[($i + 1) % $n];
            $perimeter += hypot($b['x'] - $a['x'], $b['y'] - $a['y']);
        }

        return $perimeter;
    }

    /** @param list<array{x: float, y: float}> $points */
    private function polygonArea(array $points): float
    {
        $area = 0.0;
        $n = count($points);

        for ($i = 0; $i < $n; $i++) {
            $a = $points[$i];
            $b = $points[($i + 1) % $n];
            $area += $a['x'] * $b['y'] - $b['x'] * $a['y'];
        }

        return abs($area) / 2.0;
    }

    /**
     * Fraction of ink pixels that lie inside the traced polygon (how well the
     * outline explains the actual ink).
     *
     * @param  array<int, array<int, int>>  $mask
     * @param  list<array{x: float, y: float}>  $boundary
     */
    private function inkInsidePolygonRatio(array $mask, array $boundary, float $polygonArea): float
    {
        $insideCount = 0;
        $totalCount = 0;

        foreach ($mask as $row) {
            foreach ($row as $ink) {
                if ($ink !== 1) {
                    continue;
                }
                $totalCount++;
            }
        }

        if ($totalCount === 0 || $polygonArea <= 0) {
            return 0.0;
        }

        // Estimate: convex-ish coverage via bounding fill ratio.
        $xs = array_column($boundary, 'x');
        $ys = array_column($boundary, 'y');
        $bboxArea = (max($xs) - min($xs) + 1) * (max($ys) - min($ys) + 1);

        $coverage = $polygonArea / max(1.0, $bboxArea);
        $expectedInside = $coverage * $totalCount;

        return min(1.0, $expectedInside / $totalCount);
    }

    /**
     * Counts dominant corners by walking the boundary and measuring turn
     * angles over a sliding window.
     *
     * @param  list<array{x: float, y: float}>  $boundary
     * @return int 0..8 dominant corners
     */
    private function countCorners(array $boundary): int
    {
        $n = count($boundary);
        if ($n < 12) {
            return 0;
        }

        $window = max(3, intdiv($n, 24));
        $cornerMarks = [];

        for ($i = 0; $i < $n; $i += $window) {
            $p1 = $boundary[($i - $window + $n) % $n];
            $p2 = $boundary[$i];
            $p3 = $boundary[($i + $window) % $n];

            $angle = $this->turnAngle($p1, $p2, $p3);

            if (abs($angle) > 38) { // degrees — sharp direction change
                $cornerMarks[] = $i;
            }
        }

        // Merge adjacent marks.
        $merged = [];
        foreach ($cornerMarks as $mark) {
            if ($merged === [] || $mark - end($merged) > $window) {
                $merged[] = $mark;
            }
        }

        return min(8, count($merged));
    }

    /** @param array{x: float, y: float} ...$points */
    private function turnAngle(array $p1, array $p2, array $p3): float
    {
        $v1 = [$p1['x'] - $p2['x'], $p1['y'] - $p2['y']];
        $v2 = [$p3['x'] - $p2['x'], $p3['y'] - $p2['y']];

        $dot = $v1[0] * $v2[0] + $v1[1] * $v2[1];
        $norm = hypot($v1[0], $v1[1]) * hypot($v2[0], $v2[1]);

        if ($norm == 0) {
            return 0.0;
        }

        return rad2deg(acos(max(-1.0, min(1.0, $dot / $norm))));
    }

    /**
     * Picks the N most representative corner points from the boundary
     * (extremes along principal directions).
     *
     * @param  list<array{x: float, y: float}>  $boundary
     * @return list<array{x: float, y: float}>
     */
    private function principalCorners(array $boundary, int $count): array
    {
        // Rotate-and-select: take extremes of projections onto rotating axes.
        $candidates = [];
        $steps = 36;

        for ($s = 0; $s < $steps; $s++) {
            $theta = M_PI * $s / $steps;
            $cos = cos($theta);
            $sin = sin($theta);

            $minPoint = $maxPoint = $boundary[0];
            $minVal = PHP_FLOAT_MAX;
            $maxVal = PHP_FLOAT_MIN;

            foreach ($boundary as $point) {
                $proj = $point['x'] * $cos + $point['y'] * $sin;
                if ($proj < $minVal) {
                    $minVal = $proj;
                    $minPoint = $point;
                }
                if ($proj > $maxVal) {
                    $maxVal = $proj;
                    $maxPoint = $point;
                }
            }

            $candidates[] = $minPoint;
            $candidates[] = $maxPoint;
        }

        // Deduplicate near points then pick spread-out corners greedily.
        $unique = [];
        foreach ($candidates as $candidate) {
            foreach ($unique as $existing) {
                if (hypot($existing['x'] - $candidate['x'], $existing['y'] - $candidate['y']) < 6) {
                    continue 2;
                }
            }
            $unique[] = $candidate;
        }

        usort($unique, fn (array $a, array $b): int => atan2($a['y'], $a['x']) <=> atan2($b['y'], $b['x']));

        if (count($unique) <= $count) {
            return $unique;
        }

        // Evenly sample around the centroid.
        $cx = array_sum(array_column($unique, 'x')) / count($unique);
        $cy = array_sum(array_column($unique, 'y')) / count($unique);

        usort($unique, fn (array $a, array $b): int => atan2($a['y'] - $cy, $a['x'] - $cx) <=> atan2($b['y'] - $cy, $b['x'] - $cx));

        $picked = [];
        $stride = count($unique) / $count;

        for ($i = 0; $i < $count; $i++) {
            $picked[] = $unique[(int) floor($i * $stride)];
        }

        return $picked;
    }

    /**
     * How close a quadrilateral is to right angles (0..1).
     *
     * @param  list<array{x: float, y: float}>  $quad
     */
    private function quadrilateralRightness(array $quad): float
    {
        if (count($quad) !== 4) {
            return 0.0;
        }

        $score = 0.0;
        for ($i = 0; $i < 4; $i++) {
            $prev = $quad[($i + 3) % 4];
            $cur = $quad[$i];
            $next = $quad[($i + 1) % 4];

            $deviation = abs(90 - $this->turnAngle($prev, $cur, $next));
            $score += max(0.0, 1 - $deviation / 45);
        }

        return $score / 4;
    }

    /**
     * Renders the classified shape (+ labels) into an SVG string.
     *
     * @param  array{kind: string, params: array<string, mixed>}  $shape
     * @param  list<array{text: string, x: int, y: int}>  $labels
     */
    private function renderSvg(array $shape, array $labels, int $width, int $height): string
    {
        $pad = 6;
        $vw = max(40, $width + $pad * 2);
        $vh = max(40, $height + $pad * 2);

        $body = match ($shape['kind']) {
            'circle', 'ellipse' => sprintf(
                '<ellipse cx="%s" cy="%s" rx="%s" ry="%s"/>',
                (float) $shape['params']['cx'] + $pad,
                (float) $shape['params']['cy'] + $pad,
                (float) $shape['params']['rx'],
                (float) $shape['params']['ry'],
            ),
            'triangle', 'square', 'rectangle' => $this->polygonElement($shape['params']['points'], $pad),
            'line' => sprintf(
                '<line x1="%s" y1="%s" x2="%s" y2="%s"/>',
                (float) $shape['params']['x1'] + $pad,
                (float) $shape['params']['y1'] + $pad,
                (float) $shape['params']['x2'] + $pad,
                (float) $shape['params']['y2'] + $pad,
            ),
            'axes' => sprintf(
                '<line x1="%d" y1="0" x2="%d" y2="%d"/><line x1="0" y1="%d" x2="%d" y2="%d"/>',
                (int) $shape['params']['originX'] + $pad,
                (int) $shape['params']['originX'] + $pad,
                (int) $vh,
                (int) $shape['params']['originY'] + $pad,
                (int) $vw,
                (int) $shape['params']['originY'] + $pad,
            ),
            default => '',
        };

        $labelElements = '';
        foreach (array_slice($labels, 0, 24) as $label) {
            $labelElements .= sprintf(
                '<text x="%d" y="%d">%s</text>',
                $label['x'] + $pad,
                $label['y'] + $pad,
                htmlspecialchars($label['text'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'),
            );
        }

        return sprintf(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" class="qdoc-svg"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">%s</g><g font-size="13" fill="currentColor" text-anchor="middle">%s</g></svg>',
            $vw,
            $vh,
            $body,
            $labelElements,
        );
    }

    /**
     * @param  list<array{x: float, y: float}>  $points
     */
    private function polygonElement(array $points, int $pad): string
    {
        $coords = implode(' ', array_map(
            fn (array $p): string => sprintf('%s,%s', round((float) $p['x'] + $pad, 1), round((float) $p['y'] + $pad, 1)),
            $points,
        ));

        return '<polygon points="'.$coords.'"/>';
    }

    /**
     * @return array<string, mixed>
     */
    private function unresolved(array $region, string $reason): array
    {
        return [
            'type' => 'unresolved_visual',
            'reason' => $reason,
            'region' => [
                'x' => $region['x'],
                'y' => $region['y'],
                'w' => $region['w'],
                'h' => $region['h'],
            ],
            'confidence' => 0.0,
        ];
    }
}
