<?php

namespace App\Services\ExamBank\Import;

use App\Services\ExamBank\Import\Ocr\OcrWord;
use App\Services\ExamBank\Import\Ocr\OcrWordSet;

/**
 * Assembles the final structured question document from prepared artifacts:
 * LayoutBuilder text blocks (with bboxes), reconstructed diagram blocks and
 * OCR words for direction/language detection.
 *
 * Output contract (content_document JSON, version 1):
 * {
 *   version: 1,
 *   direction: "rtl" | "ltr",
 *   language: "ar" | "en" | "mixed",
 *   meta: { ocrConfidence?: float, degraded?: bool },
 *   blocks: [
 *     { type: "paragraph", runs: [{ kind: "text"|"inline_math", ... }] },
 *     { type: "heading", level: 2|3, runs: [...] },
 *     { type: "math", latex, display: true, confidence },
 *     { type: "diagram", format: "svg", svg, shapes[], labels[], confidence },
 *     { type: "list", ordered, items: [{ marker, runs }] },
 *     { type: "table", rows: string[][], headerRow? },
 *     { type: "unresolved_visual", reason, confidence }
 *   ]
 * }
 */
final class DocumentComposer
{
    public function __construct(
        private readonly MathConverter $math,
    ) {}

    /**
     * @param  list<array<string, mixed>>  $textBlocks  LayoutBuilder::buildBlocks output (paragraph/heading/list/table with bbox)
     * @param  list<array<string, mixed>>  $diagramBlocks  DiagramReconstructor drafts (diagram/unresolved_visual, original-scale bbox attached)
     * @param  OcrWordSet  $words  full-page OCR words (original scale)
     * @param  array{degraded?: bool}  $meta
     * @return array<string, mixed>
     */
    public function compose(array $textBlocks, array $diagramBlocks, OcrWordSet $words, array $meta = []): array
    {
        [$direction, $language] = $this->detectDirectionAndLanguage($textBlocks, $words);

        // Interleave text blocks and diagram blocks by vertical position.
        $entries = [];

        foreach ($textBlocks as $block) {
            $bbox = (array) ($block['bbox'] ?? []);
            $entries[] = [
                'order' => (float) ($bbox['y'] ?? 0),
                'kind' => 'text',
                'payload' => $block,
            ];
        }

        foreach ($diagramBlocks as $block) {
            $region = (array) ($block['region'] ?? []);
            $entries[] = [
                'order' => (float) ($region['y'] ?? 0) + ((float) ($region['h'] ?? 0)) / 2000.0,
                'kind' => 'diagram',
                'payload' => $block,
            ];
        }

        usort($entries, fn (array $a, array $b): int => $a['order'] <=> $b['order']);

        $blocks = [];
        $confidenceScores = [];

        foreach ($entries as $entry) {
            $block = $this->composeBlock($entry['payload'], $entry['kind'], $confidenceScores);

            if ($block !== null) {
                $blocks[] = $block;
            }
        }

        $document = [
            'version' => 1,
            'direction' => $direction,
            'language' => $language,
            'blocks' => $blocks,
        ];

        if (! empty($meta['degraded'])) {
            $document['meta']['ocr'] = 'unavailable';
        }

        if ($confidenceScores !== []) {
            $document['meta']['ocrConfidence'] = round(collect($confidenceScores)->avg(), 3);
        }

        return $document;
    }

    /**
     * Converts one draft into its final document block.
     *
     * @param  array<string, mixed>  $payload
     * @param  list<float>  $confidenceScores  (by reference)
     * @return array<string, mixed>|null
     */
    private function composeBlock(array $payload, string $kind, array &$confidenceScores): ?array
    {
        if ($kind === 'diagram') {
            if (($payload['type'] ?? '') === 'diagram'
                && isset($payload['confidence']) && is_numeric($payload['confidence'])) {
                $confidenceScores[] = (float) $payload['confidence'];
            }

            unset($payload['region']);

            return $payload;
        }

        return match ($payload['type'] ?? '') {
            'paragraph' => $this->paragraphBlock($payload, $confidenceScores),
            'heading' => $this->headingBlock($payload, $confidenceScores),
            'list' => $this->listBlock($payload, $confidenceScores),
            'table' => $this->tableBlock($payload),
            default => null,
        };
    }

    /**
     * Paragraph: whole-line display math or mixed inline runs.
     *
     * @param  array<string, mixed>  $block
     * @param  list<float>  $confidenceScores
     * @return array<string, mixed>|null
     */
    private function paragraphBlock(array $block, array &$confidenceScores): ?array
    {
        $text = trim((string) ($block['text'] ?? ''));

        if ($text === '') {
            return null;
        }

        if (isset($block['confidence']) && is_numeric($block['confidence'])) {
            $confidenceScores[] = (float) $block['confidence'];
        }

        // A line that is essentially one equation becomes a display math block.
        $stripped = trim(preg_replace('/^[^\p{L}\d(]{0,4}|[^\p{L}\d)]{0,4}$/u', '', $text) ?? $text);

        if ($this->looksLikeDisplayMath($stripped)) {
            $converted = $this->math->convertLine($stripped, (float) ($block['confidence'] ?? 0.8));

            if ($converted !== null && mb_strlen(trim((string) preg_replace('/[\p{L}\s]/u', '', $converted['latex'] ?? ''))) > 0) {
                return [
                    'type' => 'math',
                    'latex' => $converted['latex'],
                    'display' => true,
                    'confidence' => round(($converted['confidence'] ?? 0.5) * 0.9, 3),
                ];
            }
        }

        $runs = $this->segmentRuns($text);

        if ($runs === []) {
            return null;
        }

        return ['type' => 'paragraph', 'runs' => $runs];
    }

    /**
     * @param  array<string, mixed>  $block
     * @param  list<float>  $confidenceScores
     * @return array<string, mixed>
     */
    private function headingBlock(array $block, array &$confidenceScores): array
    {
        $text = trim((string) ($block['text'] ?? ''));

        if (isset($block['confidence']) && is_numeric($block['confidence'])) {
            $confidenceScores[] = (float) $block['confidence'];
        }

        return [
            'type' => 'heading',
            'level' => in_array($block['level'] ?? null, [2, 3], true) ? (int) $block['level'] : 2,
            'runs' => $this->segmentRuns($text) ?: [['kind' => 'text', 'text' => $text]],
        ];
    }

    /**
     * @param  array<string, mixed>  $block
     * @param  list<float>  $confidenceScores
     * @return array<string, mixed>|null
     */
    private function listBlock(array $block, array &$confidenceScores): ?array
    {
        $items = [];

        foreach ((array) ($block['items'] ?? []) as $item) {
            $itemText = trim((string) ($item['text'] ?? ''));
            $marker = trim((string) ($item['marker'] ?? '-'));

            // Strip the marker prefix from the item body when OCR kept it.
            $body = $marker !== '' && str_starts_with($itemText, $marker)
                ? trim(mb_substr($itemText, mb_strlen($marker)))
                : $itemText;

            $runs = $this->segmentRuns($body);

            if ($runs === []) {
                continue;
            }

            if (isset($item['confidence']) && is_numeric($item['confidence'])) {
                $confidenceScores[] = (float) $item['confidence'];
            }

            $items[] = ['marker' => $marker, 'runs' => $runs];
        }

        if ($items === []) {
            return null;
        }

        return [
            'type' => 'list',
            'ordered' => (bool) ($block['ordered'] ?? false),
            'items' => $items,
        ];
    }

    /**
     * @param  array<string, mixed>  $block
     * @return array<string, mixed>|null
     */
    private function tableBlock(array $block): ?array
    {
        $rows = (array) ($block['rows'] ?? []);

        if ($rows === []) {
            return null;
        }

        return [
            'type' => 'table',
            'rows' => array_values(array_map(
                fn (array $row): array => array_values(array_map(fn ($cell): string => trim((string) $cell), $row)),
                $rows,
            )),
            'headerRow' => false,
        ];
    }

    /**
     * Splits a text line into plain-text and inline-math runs.
     *
     * @return list<array<string, mixed>>
     */
    private function segmentRuns(string $text): array
    {
        $runs = [];

        foreach ($this->math->segmentLine($text) as $segment) {
            if (($segment['kind'] ?? '') === 'inline_math') {
                $latex = trim((string) ($segment['latex'] ?? ''));

                if ($latex !== '') {
                    $runs[] = [
                        'kind' => 'inline_math',
                        'latex' => $latex,
                        'confidence' => round((float) ($segment['confidence'] ?? 0.5), 3),
                    ];

                    continue;
                }
            }

            $plain = trim((string) ($segment['text'] ?? ''));

            if ($plain !== '') {
                $runs[] = ['kind' => 'text', 'text' => $plain];
            }
        }

        return $runs;
    }

    /**
     * Direction from per-block rtl flags; language from character counts.
     *
     * @param  list<array<string, mixed>>  $textBlocks
     */
    private function detectDirectionAndLanguage(array $textBlocks, OcrWordSet $words): array
    {
        [$arabicChars, $latinChars] = $this->characterCounts($words->words);

        $rtlBlocks = count(array_filter(
            $textBlocks,
            fn (array $block): bool => ! empty($block['rtl']),
        ));
        $totalTextBlocks = count($textBlocks);

        if ($totalTextBlocks > 0 && $rtlBlocks / $totalTextBlocks >= 0.6) {
            return ['rtl', $latinChars > $arabicChars * 2 ? 'mixed' : 'ar'];
        }

        if ($totalTextBlocks === 0) {
            return [$arabicChars >= $latinChars ? 'rtl' : 'ltr', $arabicChars >= $latinChars ? 'ar' : 'en'];
        }

        if ($arabicChars > $latinChars * 2) {
            return ['rtl', 'ar'];
        }

        if ($arabicChars > 0 && $latinChars > 0) {
            return ['rtl', 'mixed'];
        }

        return ['ltr', $arabicChars > 0 ? 'mixed' : 'en'];
    }

    /** @param list<OcrWord> $words @return array{0: int, 1: int} */
    private function characterCounts(array $words): array
    {
        $arabic = 0;
        $latin = 0;

        foreach ($words as $word) {
            $arabic += (int) preg_match_all('/[\x{0600}-\x{06FF}]/u', $word->text);
            $latin += (int) preg_match_all('/[A-Za-z]/', $word->text);
        }

        return [$arabic, $latin];
    }

    private function looksLikeDisplayMath(string $text): bool
    {
        $hasContent = preg_match('/[A-Za-z0-9]/u', $text) === 1;
        $hasMathStructure = preg_match('/[=<>≤≥≠≈±√∫∑°]|\^|_\{|\d\s*[+\-×÷*\/]\s*\d|[a-zA-Z]\s*\(/u', $text) === 1;
        $mostlySymbols = mb_strlen((string) preg_replace('/[\p{Arabic}\s]/u', '', $text)) >= mb_strlen($text) * 0.6;

        return $hasContent && $hasMathStructure && $mostlySymbols && mb_strlen($text) <= 400;
    }
}
