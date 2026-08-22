<?php

namespace App\Services\ExamBank\Import;

use App\Services\ExamBank\Import\Ocr\OcrWord;
use App\Services\ExamBank\Import\Ocr\OcrWordSet;

/**
 * Reconstructs reading structure from OCR words and pixel components.
 *
 * Responsibilities:
 *  - cluster words into visual lines (geometric, robust against Tesseract
 *    block fragmentation),
 *  - merge lines into paragraphs / list items / table candidates,
 *  - detect per-line and document direction (Arabic vs Latin density),
 *  - separate graphic regions (ink clusters that are not text) for diagram
 *    reconstruction.
 */
final class LayoutBuilder
{
    public function __construct(
        private readonly float $tableMinConfidence = 0.55,
    ) {}

    /**
     * Document direction from the Arabic character ratio of all words.
     *
     * @param list<OcrWord> $words
     */
    public function detectDirection(array $words): string
    {
        [$arabic, $latin] = $this->scriptCounts($words);

        return ($arabic + $latin === 0) || $arabic >= $latin * 0.35 ? 'rtl' : 'ltr';
    }

    /**
     * Groups words into visual lines.
     *
     * Each line: words ordered by reading direction, geometry and metadata.
     *
     * @return list<array{words: list<OcrWord>, text: string, x1: float, x2: float, y1: float, y2: float, height: float, rtl: bool}>
     */
    public function buildLines(OcrWordSet $set): array
    {
        $words = array_values(array_filter($set->words, fn (OcrWord $w): bool => trim($w->text) !== ''));

        if ($words === []) {
            return [];
        }

        usort($words, fn (OcrWord $a, OcrWord $b): int => [$a->y, $a->x] <=> [$b->y, $b->x]);

        /** @var list<list<OcrWord>> $clusters */
        $clusters = [];
        $current = [];
        $currentTop = 0.0;
        $currentBottom = 0.0;

        foreach ($words as $word) {
            if ($current === []) {
                $current = [$word];
                $currentTop = $word->y;
                $currentBottom = $word->y2();
                continue;
            }

            $overlapLimit = 0.55 * max($word->height, $currentBottom - $currentTop);

            if ($this->verticalOverlap($currentTop, $currentBottom, $word->y, $word->y2()) >= $overlapLimit) {
                $current[] = $word;
                $currentTop = min($currentTop, $word->y);
                $currentBottom = max($currentBottom, $word->y2());
            } else {
                $clusters[] = $current;
                $current = [$word];
                $currentTop = $word->y;
                $currentBottom = $word->y2();
            }
        }

        if ($current !== []) {
            $clusters[] = $current;
        }

        $lines = [];
        foreach ($clusters as $cluster) {
            $rtl = $this->isLineRtl($cluster);
            usort($cluster, fn (OcrWord $a, OcrWord $b): int => $rtl ? $b->x <=> $a->x : $a->x <=> $b->x);

            $xs = array_map(fn (OcrWord $w): float => $w->x, $cluster);
            $x2s = array_map(fn (OcrWord $w): float => $w->x2(), $cluster);
            $ys = array_map(fn (OcrWord $w): float => $w->y, $cluster);
            $y2s = array_map(fn (OcrWord $w): float => $w->y2(), $cluster);

            $lines[] = [
                'words' => $cluster,
                'text' => implode(' ', array_map(fn (OcrWord $w): string => $w->text, $cluster)),
                'x1' => min($xs),
                'x2' => max($x2s),
                'y1' => min($ys),
                'y2' => max($y2s),
                'height' => max($y2s) - min($ys),
                'rtl' => $rtl,
            ];
        }

        return $lines;
    }

    /**
     * Merges consecutive lines into content block drafts:
     * paragraphs, headings, ordered/unordered lists and table candidates.
     *
     * @param  list<array{words: list<OcrWord>, text: string, x1: float, x2: float, y1: float, y2: float, height: float, rtl: bool}>  $lines
     * @return list<array<string, mixed>> draft blocks (type + payload + confidence)
     */
    public function buildBlocks(array $lines): array
    {
        if ($lines === []) {
            return [];
        }

        $heights = array_map(fn (array $l): float => max(1.0, $l['height']), $lines);
        sort($heights);
        $medianHeight = $heights[intdiv(count($heights), 2)];

        $blocks = [];

        // Pass 1: split lines into runs of list items vs plain lines.
        $runs = $this->splitIntoRuns($lines, $medianHeight);

        foreach ($runs as $run) {
            if ($run['kind'] === 'list') {
                $items = [];
                foreach ($run['lines'] as $line) {
                    $items[] = [
                        'marker' => $line['marker'],
                        'text' => $line['text'],
                        'confidence' => $this->lineConfidence($line['words']),
                    ];
                }

                $blocks[] = [
                    'type' => 'list',
                    'ordered' => true,
                    'items' => $items,
                    'confidence' => round(collect($items)->avg('confidence') ?? 0.5, 3),
                    'bbox' => $this->bboxOfLines($run['lines']),
                ];
                continue;
            }

            // Pass 2: try to interpret a run of ≥3 aligned lines as a table.
            if (count($run['lines']) >= 3) {
                $table = $this->tryBuildTable($run['lines']);
                if ($table !== null && $table['confidence'] >= $this->tableMinConfidence) {
                    $blocks[] = $table + ['bbox' => $this->bboxOfLines($run['lines'])];
                    continue;
                }
            }

            // Pass 3: paragraph merging with heading detection.
            $paragraphLines = [];
            $flush = function () use (&$paragraphLines, &$blocks, $medianHeight): void {
                if ($paragraphLines === []) {
                    return;
                }
                $blocks[] = $this->buildParagraphOrHeading($paragraphLines, $medianHeight);
                $paragraphLines = [];
            };

            foreach ($run['lines'] as $index => $line) {
                if ($paragraphLines === []) {
                    $paragraphLines[] = $line;
                    continue;
                }

                $prev = $paragraphLines[count($paragraphLines) - 1];
                $gap = $line['y1'] - $prev['y2'];
                $alignmentShift = abs($line['x2'] - $prev['x2']);

                $newParagraph = $gap > 0.9 * $medianHeight
                    || $alignmentShift > 0.18 * max($prev['height'], $line['height'], 8)
                    || $prev['rtl'] !== $line['rtl'];

                if ($newParagraph) {
                    $flush();
                }

                $paragraphLines[] = $line;
            }

            $flush();
        }

        return $blocks;
    }

    /**
     * Finds graphic regions: ink component clusters that do not overlap text.
     *
     * @param  list<array{x: int, y: int, w: int, h: int, ink: int, fill: float}>  $components  analysis-scale components
     * @param  list<array{x1: float, x2: float, y1: float, y2: float}>  $lines       analysis-scale lines
     * @return list<array{x: int, y: int, w: int, h: int, ink: int}> original-scale regions
     */
    public function graphicRegions(array $components, array $lines, float $scale): array
    {
        $graphic = [];

        foreach ($components as $component) {
            if (! $this->looksGraphic($component)) {
                continue;
            }

            $cx1 = $component['x'];
            $cy1 = $component['y'];
            $cx2 = $component['x'] + $component['w'];
            $cy2 = $component['y'] + $component['h'];

            $textOverlap = 0.0;
            $componentArea = max(1.0, (float) ($component['w'] * $component['h']));

            foreach ($lines as $line) {
                $ox = max(0.0, min($cx2, $line['x2']) - max($cx1, $line['x1']));
                $oy = max(0.0, min($cy2, $line['y2']) - max($cy1, $line['y1']));
                $textOverlap += $ox * $oy;
            }

            if ($textOverlap / $componentArea > 0.30) {
                continue; // mostly covered by recognized text → not a diagram
            }

            $graphic[] = ['x' => $cx1, 'y' => $cy1, 'w' => $component['w'], 'h' => $component['h'], 'ink' => $component['ink']];
        }

        if ($graphic === []) {
            return [];
        }

        // Merge regions whose bounding boxes nearly touch (diagram parts).
        $merged = [];
        foreach ($graphic as $region) {
            $absorbed = false;
            foreach ($merged as &$target) {
                if ($this->nearby($target, $region, tolerance: 24)) {
                    $nx1 = min($target['x'], $region['x']);
                    $ny1 = min($target['y'], $region['y']);
                    $nx2 = max($target['x'] + $target['w'], $region['x'] + $region['w']);
                    $ny2 = max($target['y'] + $target['h'], $region['y'] + $region['h']);
                    $target = [
                        'x' => $nx1,
                        'y' => $ny1,
                        'w' => $nx2 - $nx1,
                        'h' => $ny2 - $ny1,
                        'ink' => $target['ink'] + $region['ink'],
                    ];
                    $absorbed = true;
                    break;
                }
            }
            unset($target);

            if (! $absorbed) {
                $merged[] = $region;
            }
        }

        // Scale back to original image coordinates.
        return array_map(fn (array $r): array => [
            'x' => (int) round($r['x'] / max(0.000001, $scale)),
            'y' => (int) round($r['y'] / max(0.000001, $scale)),
            'w' => (int) round($r['w'] / max(0.000001, $scale)),
            'h' => (int) round($r['h'] / max(0.000001, $scale)),
            'ink' => $r['ink'],
        ], $merged);
    }

    // ════════════════════════════════════════════════════════════
    //  Internals
    // ════════════════════════════════════════════════════════════

    /** @param list<OcrWord> $words @return array{0: int, 1: int} */
    private function scriptCounts(array $words): array
    {
        $arabic = 0;
        $latin = 0;

        foreach ($words as $word) {
            $arabic += preg_match_all('/[\x{0600}-\x{06FF}\x{0750}-\x{077F}\x{FB50}-\x{FDFF}\x{FE70}-\x{FEFF}]/u', $word->text);
            $latin += preg_match_all('/[A-Za-z]/', $word->text);
        }

        return [$arabic, $latin];
    }

    /** @param list<OcrWord> $words */
    private function isLineRtl(array $words): bool
    {
        [$arabic, $latin] = $this->scriptCounts($words);

        return $arabic > 0 && $arabic >= $latin;
    }

    private function verticalOverlap(float $topA, float $bottomA, float $topB, float $bottomB): float
    {
        return max(0.0, min($bottomA, $bottomB) - max($topA, $topB));
    }

    /**
     * Splits lines into alternating runs of list-item lines and other lines.
     *
     * @param  list<array{words: list<array>, text: string, x1: float, x2: float, y1: float, y2: float, height: float, rtl: bool}>  $lines
     * @return list<array{kind: string, lines: list<array>}>
     */
    private function splitIntoRuns(array $lines, float $medianHeight): array
    {
        $runs = [];
        $currentKind = null;
        $currentLines = [];

        $flush = function () use (&$runs, &$currentKind, &$currentLines): void {
            if ($currentKind !== null && $currentLines !== []) {
                $runs[] = ['kind' => $currentKind, 'lines' => $currentLines];
            }
            $currentLines = [];
        };

        foreach ($lines as $line) {
            $marker = $this->matchListMarker($line['text']);

            if ($marker !== null) {
                $line['marker'] = $marker;
            }

            $kind = $marker !== null ? 'list' : 'plain';

            if ($currentKind !== $kind) {
                $flush();
                $currentKind = $kind;
            }

            $currentLines[] = $line;
        }

        $flush();

        return $runs;
    }

    /**
     * Matches leading enumeration markers used in Arabic/Latin question papers:
     * "1." "1)" "- " "أ)" "ا." "(ب)" "١-" "Q1:" etc. Returns the marker or null.
     */
    private function matchListMarker(string $text): ?string
    {
        if (preg_match('/^(\(?\s*(?:\d{1,3}|[\x{0660}-\x{0669}]{1,3}|[A-Za-z]|[\x{0621}-\x{064A}])\s*[\.\)\-–—:]|\-\s)\s*/u', $text, $m)) {
            return trim($m[1]);
        }

        return null;
    }

    /** @param list<OcrWord> $words */
    private function lineConfidence(array $words): float
    {
        $sum = 0.0;
        $count = 0;

        foreach ($words as $word) {
            if ($word->confidence !== null) {
                $sum += $word->confidence;
                $count++;
            }
        }

        return $count > 0 ? round(($sum / $count) / 100, 3) : 0.5;
    }

    /**
     * Attempts to interpret ≥3 consecutive lines as a grid-aligned table.
     *
     * Column boundaries must repeat across most rows within a tolerance.
     *
     * @param  list<array>  $lines
     * @return array<string, mixed>|null
     */
    private function tryBuildTable(array $lines): ?array
    {
        $tolerance = 14.0;

        // Candidate column edges: every word start/end x coordinate.
        $edges = [];
        foreach ($lines as $line) {
            foreach ($line['words'] as $word) {
                /** @var OcrWord $word */
                $edges[] = (int) round($word->x);
                $edges[] = (int) round($word->x2());
            }
        }
        $edges = array_values(array_unique($edges));
        sort($edges);

        // Cluster nearby edges into boundary candidates.
        $boundaries = [];
        foreach ($edges as $edge) {
            if ($boundaries !== [] && $edge - end($boundaries) <= $tolerance) {
                continue;
            }
            $boundaries[] = $edge;
        }

        if (count($boundaries) < 4) {
            return null;
        }

        // For each row, find which boundaries it aligns with.
        $rowsCells = [];
        $alignedCount = array_fill(0, count($boundaries), 0);

        foreach ($lines as $line) {
            $cells = [];
            foreach ($line['words'] as $word) {
                /** @var OcrWord $word */
                $startIdx = $this->nearestBoundaryIndex($boundaries, (int) round($word->x), $tolerance);
                if ($startIdx !== null) {
                    $alignedCount[$startIdx]++;
                }
                $cells[] = ['start' => (int) round($word->x), 'end' => (int) round($word->x2()), 'text' => $word->text];
            }
            $rowsCells[] = $cells;
        }

        // Keep boundaries that at least half of the rows align with.
        $rowCount = count($rowsCells);
        $strongBoundaries = [];
        foreach ($boundaries as $i => $boundary) {
            if ($alignedCount[$i] >= max(2, (int) ceil($rowCount * 0.5))) {
                $strongBoundaries[] = ['x' => $boundary, 'votes' => $alignedCount[$i]];
            }
        }

        if (count($strongBoundaries) < 3) {
            return null;
        }

        // Build cell grid: assign each word to the column pair it spans.
        $columnXs = array_column($strongBoundaries, 'x');
        $gridRows = [];
        $totalWords = 0;
        $alignedWords = 0;

        foreach ($rowsCells as $cells) {
            $row = array_fill(0, count($columnXs) - 1, []);
            foreach ($cells as $cell) {
                $totalWords++;
                $colStart = $this->nearestColumnIndex($columnXs, $cell['start'], $tolerance * 2);
                $colEnd = $this->nearestColumnIndex($columnXs, $cell['end'], $tolerance * 2);

                if ($colStart === null || $colEnd === null || $colEnd < $colStart) {
                    continue;
                }

                $spanned = range($colStart, min($colEnd, count($row) - 1));
                $alignedWords++;
                foreach ($spanned as $col) {
                    $row[$col][] = $cell['text'];
                }
            }

            $gridRows[] = array_map(
                fn (array $cellTexts): string => implode(' ', $cellTexts),
                $row,
            );
        }

        if ($totalWords === 0) {
            return null;
        }

        $alignmentRatio = $alignedWords / $totalWords;
        $columnsRatio = min(1.0, (count($columnXs) - 1) / 3);
        $confidence = round(min(0.95, 0.45 * $alignmentRatio + 0.35 * $columnsRatio + 0.20 * min(1.0, $rowCount / 4)), 3);

        if ($alignmentRatio < 0.6 || count($columnXs) < 3) {
            return null;
        }

        return [
            'type' => 'table',
            'rows' => $gridRows,
            'confidence' => $confidence,
        ];
    }

    /** @param list<int> $boundaries */
    private function nearestBoundaryIndex(array $boundaries, int $value, float $tolerance): ?int
    {
        $best = null;
        $bestDistance = $tolerance;

        foreach ($boundaries as $i => $candidate) {
            $distance = abs($candidate - $value);
            if ($distance <= $bestDistance) {
                $bestDistance = $distance;
                $best = $i;
            }
        }

        return $best;
    }

    /** @param list<float|int> $columns */
    private function nearestColumnIndex(array $columns, int $value, float $tolerance): ?int
    {
        $best = null;
        $bestDistance = $tolerance;

        foreach ($columns as $i => $candidate) {
            $distance = abs((float) $candidate - $value);
            if ($distance <= $bestDistance) {
                $bestDistance = $distance;
                $best = $i;
            }
        }

        return $best;
    }

    /**
     * Builds one paragraph — or a heading when a single line is markedly
     * larger than the page median.
     *
     * @param  list<array>  $lines
     * @return array<string, mixed>
     */
    private function buildParagraphOrHeading(array $lines, float $medianHeight): array
    {
        $first = $lines[0];

        if (count($lines) === 1 && $first['height'] > 1.45 * $medianHeight && mb_strlen(trim($first['text'])) <= 120) {
            return [
                'type' => 'heading',
                'level' => 2,
                'text' => trim($first['text']),
                'rtl' => $first['rtl'],
                'confidence' => round(min(0.95, $this->lineConfidence($first['words']) + 0.05), 3),
                'bbox' => $this->bboxOfLines($lines),
            ];
        }

        $joined = implode(' ', array_map(fn (array $l): string => trim($l['text']), $lines));

        return [
            'type' => 'paragraph',
            'text' => preg_replace('/\s+/u', ' ', $joined) ?? $joined,
            'rtl' => $first['rtl'],
            'confidence' => round(
                collect($lines)->map(fn (array $l): float => $this->lineConfidence($l['words']))->avg() ?? 0.5,
                3,
            ),
            'bbox' => $this->bboxOfLines($lines),
        ];
    }

    /**
     * Union bounding box of a set of lines.
     *
     * @param  list<array{x1: float, x2: float, y1: float, y2: float}>  $lines
     * @return array{x: float, y: float, w: float, h: float}
     */
    private function bboxOfLines(array $lines): array
    {
        return [
            'x' => min(array_map(fn (array $l): float => $l['x1'], $lines)),
            'y' => min(array_map(fn (array $l): float => $l['y1'], $lines)),
            'w' => max(array_map(fn (array $l): float => $l['x2'], $lines)) - min(array_map(fn (array $l): float => $l['x1'], $lines)),
            'h' => max(array_map(fn (array $l): float => $l['y2'], $lines)) - min(array_map(fn (array $l): float => $l['y1'], $lines)),
        ];
    }

    /** @param array{x: int, y: int, w: int, h: int} $a */
    private function looksGraphic(array $component): bool
    {
        $area = $component['w'] * $component['h'];

        // Solid-ish blobs, large boxes, extreme aspect strips (rules/axes).
        if ($component['fill'] > 0.55 && $component['h'] >= 10) {
            return true;
        }

        if ($component['h'] >= 40 && $component['w'] >= 40) {
            return true;
        }

        if ($component['h'] >= 90) {
            return true;
        }

        if ($area >= 6000) {
            return true;
        }

        return false;
    }

    private function nearby(array $a, array $b, float $tolerance): bool
    {
        $ax2 = $a['x'] + $a['w'];
        $ay2 = $a['y'] + $a['h'];
        $bx2 = $b['x'] + $b['w'];
        $by2 = $b['y'] + $b['h'];

        $gapX = max($a['x'] - $bx2, $b['x'] - $ax2, 0);
        $gapY = max($a['y'] - $by2, $b['y'] - $ay2, 0);

        return hypot($gapX, $gapY) <= $tolerance;
    }
}
